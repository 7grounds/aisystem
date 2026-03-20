"""
Swiss Vault OS – Knowledge Hub Router
======================================
Handles provider discovery, vector-based tour matching, and automatic
content import when search results are sparse.
"""

from __future__ import annotations

import os
import logging
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/hub", tags=["hub"])

# ---------------------------------------------------------------------------
# DB clients
# ---------------------------------------------------------------------------

_DB_CONFIGS: dict[str, dict[str, str]] = {
    "main": {
        "url": os.environ["SUPABASE_URL"],
        "key": os.environ["SUPABASE_SERVICE_KEY"],
    },
    "knowledge": {
        "url": os.environ["KNOWLEDGE_SUPABASE_URL"],
        "key": os.environ["KNOWLEDGE_SUPABASE_SERVICE_KEY"],
    },
}

_clients: dict[str, Client] = {}


def get_db_client(db: str = "main") -> Client:
    """Return (and cache) a Supabase client for the requested database."""
    if db not in _clients:
        cfg = _DB_CONFIGS[db]
        _clients[db] = create_client(cfg["url"], cfg["key"])
    return _clients[db]


# ---------------------------------------------------------------------------
# Embedding helper
# ---------------------------------------------------------------------------

async def get_query_embedding(text: str) -> list[float]:
    """Generate an OpenAI embedding (text-embedding-3-small, 768 dims)."""
    api_key = os.environ["OPENAI_API_KEY"]
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/embeddings",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": "text-embedding-3-small",
                "input": text,
                "dimensions": 768,
            },
            timeout=30,
        )
        response.raise_for_status()
        return response.json()["data"][0]["embedding"]


# ---------------------------------------------------------------------------
# Provider loading
# ---------------------------------------------------------------------------

async def _load_providers(domain_id: str) -> list[dict[str, Any]]:
    """Load all active providers for a given domain from the main DB."""
    db = get_db_client("main")
    result = (
        db.table("providers")
        .select("*")
        .eq("domain_id", domain_id)
        .eq("active", True)
        .execute()
    )
    return result.data or []


# ---------------------------------------------------------------------------
# Auto-import helper
# ---------------------------------------------------------------------------

async def _auto_import_missing_content(
    query: str,
    domain_id: str,
) -> list[dict[str, Any]]:
    """
    Attempt to import a matching tour from the Knowledge Hub DB when the
    vector search in ``hub_match`` returned too few or too-dissimilar results.

    Search order
    ------------
    1. knowledge_trails  (destination or name ILIKE query)
    2. knowledge_sac     (name ILIKE query, entry_type = 'route')
    3. knowledge_providers (name ILIKE query)

    After a match is found
    ----------------------
    - Load attribute_mappings from main DB to resolve difficulty / crowd_index.
    - Upsert tour row into ``tours`` (ON CONFLICT (source_url) DO NOTHING).
    - Generate an OpenAI embedding and store it on the new tour row.
    - Record the search outcome in ``service_gaps``.

    Returns a list containing the newly created tour dict, or an empty list.
    """
    knowledge_db = get_db_client("knowledge")
    main_db = get_db_client("main")

    # Escape SQL wildcard characters so that literal percent signs or
    # underscores in the query are not treated as pattern wildcards.
    escaped_query = query.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    like_pattern = f"%{escaped_query}%"
    raw_record: dict[str, Any] | None = None

    # ------------------------------------------------------------------
    # Step 1 – knowledge_trails
    # ------------------------------------------------------------------
    trails_result = (
        knowledge_db.table("knowledge_trails")
        .select("*")
        .or_(f"destination.ilike.{like_pattern},name.ilike.{like_pattern}")
        .limit(3)
        .execute()
    )
    if trails_result.data:
        raw_record = trails_result.data[0]

    # ------------------------------------------------------------------
    # Step 2 – knowledge_sac (routes only)
    # ------------------------------------------------------------------
    if raw_record is None:
        sac_result = (
            knowledge_db.table("knowledge_sac")
            .select("*")
            .ilike("name", like_pattern)
            .eq("entry_type", "route")
            .limit(3)
            .execute()
        )
        if sac_result.data:
            raw_record = sac_result.data[0]

    # ------------------------------------------------------------------
    # Step 3 – knowledge_providers
    # ------------------------------------------------------------------
    if raw_record is None:
        providers_result = (
            knowledge_db.table("knowledge_providers")
            .select("*")
            .ilike("name", like_pattern)
            .limit(3)
            .execute()
        )
        if providers_result.data:
            raw_record = providers_result.data[0]

    resolved = raw_record is not None

    # ------------------------------------------------------------------
    # Step 4 – load attribute_mappings for difficulty / crowd_index
    # ------------------------------------------------------------------
    attribute_mappings: dict[str, Any] = {}
    if resolved:
        mappings_result = (
            main_db.table("attribute_mappings")
            .select("*")
            .execute()
        )
        for row in mappings_result.data or []:
            attribute_mappings[row["key"]] = row["value"]

    # ------------------------------------------------------------------
    # Step 5 – build tour dict and upsert into tours
    # ------------------------------------------------------------------
    new_tour: dict[str, Any] | None = None
    if resolved and raw_record is not None:
        difficulty_raw = raw_record.get("difficulty") or raw_record.get("level")
        crowd_raw = raw_record.get("crowd_index") or raw_record.get("crowd")

        tour_payload: dict[str, Any] = {
            "name": raw_record.get("name") or raw_record.get("destination", ""),
            "description": raw_record.get("description", ""),
            "source_url": raw_record.get("source_url") or raw_record.get("url", ""),
            "domain_id": domain_id,
            "difficulty": attribute_mappings.get(str(difficulty_raw), difficulty_raw),
            "crowd_index": attribute_mappings.get(str(crowd_raw), crowd_raw),
            "region": raw_record.get("region", ""),
            "duration_minutes": raw_record.get("duration_minutes"),
            "distance_km": raw_record.get("distance_km"),
            "elevation_gain_m": raw_record.get("elevation_gain_m"),
        }

        upsert_result = (
            main_db.table("tours")
            .upsert(tour_payload, on_conflict="source_url", ignore_duplicates=True)
            .select()
            .execute()
        )
        if upsert_result.data:
            new_tour = upsert_result.data[0]

        # ------------------------------------------------------------------
        # Step 6 – generate embedding for the new tour
        # ------------------------------------------------------------------
        if new_tour:
            embed_text = f"{new_tour.get('name', '')} {new_tour.get('description', '')}"
            try:
                embedding = await get_query_embedding(embed_text)

                # ----------------------------------------------------------
                # Step 7 – store embedding on the tour row
                # ----------------------------------------------------------
                main_db.table("tours").update({"embedding": embedding}).eq(
                    "id", new_tour["id"]
                ).execute()
                new_tour["embedding"] = embedding
            except Exception:  # noqa: BLE001
                logger.warning(
                    "Failed to generate/store embedding for tour id=%s",
                    new_tour.get("id"),
                    exc_info=True,
                )

    # ------------------------------------------------------------------
    # Step 8 – record service gap
    # ------------------------------------------------------------------
    try:
        main_db.table("service_gaps").insert(
            {
                "domain_id": domain_id,
                "query": query,
                "gap_type": "missing_content",
                "resolved": resolved,
            }
        ).execute()
    except Exception:  # noqa: BLE001
        logger.warning("Failed to insert service_gap for query=%r", query, exc_info=True)

    # ------------------------------------------------------------------
    # Step 9 – return result
    # ------------------------------------------------------------------
    return [new_tour] if new_tour else []


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class HubMatchRequest(BaseModel):
    query: str
    domain_id: str
    top_k: int = 5


class HubMatchResponse(BaseModel):
    tours: list[dict[str, Any]]
    auto_imported: bool = False


# ---------------------------------------------------------------------------
# hub_match endpoint
# ---------------------------------------------------------------------------

@router.post("/match", response_model=HubMatchResponse)
async def hub_match(body: HubMatchRequest) -> HubMatchResponse:
    """
    Vector-search the ``tours`` table for the best matches to *query*.

    If fewer than 2 results are returned **or** the highest similarity score
    is below 0.5, ``_auto_import_missing_content`` is triggered to pull new
    content from the Knowledge Hub DB and insert it into ``tours``.
    """
    db = get_db_client("main")

    # Generate query embedding
    try:
        query_embedding = await get_query_embedding(body.query)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Embedding generation failed") from exc

    # Vector search via pgvector RPC (match_tours expected in Supabase)
    try:
        search_result = db.rpc(
            "match_tours",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.0,
                "match_count": body.top_k,
                "p_domain_id": body.domain_id,
            },
        ).execute()
        tours: list[dict[str, Any]] = search_result.data or []
    except Exception as exc:
        logger.error("Vector search failed: %s", exc)
        tours = []

    # -----------------------------------------------------------------
    # TRIGGER: auto-import when results are sparse or low-confidence
    # -----------------------------------------------------------------
    result_count = len(tours)
    max_similarity = max((t.get("similarity", 0.0) for t in tours), default=0.0)

    auto_imported = False
    if result_count < 2 or max_similarity < 0.5:
        imported = await _auto_import_missing_content(body.query, body.domain_id)
        if imported:
            tours = imported + tours
            auto_imported = True

    return HubMatchResponse(tours=tours, auto_imported=auto_imported)
