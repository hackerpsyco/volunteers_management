# Debugging Session State API and Performance

This plan addresses the `AttributeError` in [api_session_state](file:///c:/Users/piyus/CLAS/CLAS/class/views.py#5891-6044), resolves slow loading times in [today_session.html](file:///c:/Users/piyus/CLAS/CLAS/old_today_session.html) through query optimization and caching, and fixes `UnicodeEncodeError` in logs by removing emojis.

## User Review Required

> [!IMPORTANT]
> Caching will be implemented for grouped session resolution and progress metrics. These caches will be invalidated whenever a session status changes (conducted, cancelled, etc.) to ensure facilitators always see accurate data.

## Proposed Changes

### [Component] API and Views (class/views.py)
- [MODIFY] [views.py](file:///c:/Users/piyus/CLAS/CLAS/class/views.py)
    - **DONE**: Fix [api_session_state](file:///c:/Users/piyus/CLAS/CLAS/class/views.py#5891-6044) to correctly check for [SessionPreparationChecklist](file:///c:/Users/piyus/CLAS/CLAS/class/models/students.py#903-979) via [PlannedSession](file:///c:/Users/piyus/CLAS/CLAS/class/models/students.py#134-240) and [Facilitator](file:///c:/Users/piyus/CLAS/CLAS/Templates/facilitator/Today_session.html#969-1020).
    - **DONE**: Replace emojis in log messages with text-based indicators to prevent `UnicodeEncodeError`.
    - [OPTIMIZE] Implement `lru_cache` or Django cache for [get_grouped_classes_for_session](file:///c:/Users/piyus/CLAS/CLAS/class/views.py#49-102).
    - [OPTIMIZE] Use `select_related` and `prefetch_related` in [today_session](file:///c:/Users/piyus/CLAS/CLAS/class/views.py#1182-1675) view to reduce query count (e.g., for [school](file:///c:/Users/piyus/CLAS/CLAS/class/views.py#272-295), [curriculum_session](file:///c:/Users/piyus/CLAS/CLAS/class/services/curriculum_content_resolver.py#215-230), etc.).

### [Component] Session Management (class/session_management.py)
- [MODIFY] [session_management.py](file:///c:/Users/piyus/CLAS/CLAS/class/session_management.py)
    - [OPTIMIZE] Refactor [calculate_progress](file:///c:/Users/piyus/CLAS/CLAS/class/session_management.py#255-341) to consolidate grouped session lookups.
    - [OPTIMIZE] Cache [ProgressMetrics](file:///c:/Users/piyus/CLAS/CLAS/class/session_management.py#37-49) result using Django's cache framework (timeout: 1 hour, invalidated on session updates).
    - [OPTIMIZE] Optimize [get_next_pending_session](file:///c:/Users/piyus/CLAS/CLAS/class/session_management.py#57-201) to avoid redundant queries when grouping is already known.

### [Component] Integration Services (class/services/)
- [MODIFY] [session_integration_service.py](file:///c:/Users/piyus/CLAS/CLAS/class/services/session_integration_service.py)
    - **DONE**: Replace emojis in log messages.
- [MODIFY] [curriculum_content_resolver.py](file:///c:/Users/piyus/CLAS/CLAS/class/services/curriculum_content_resolver.py)
    - [OPTIMIZE] Implement caching for [get_content_metadata](file:///c:/Users/piyus/CLAS/CLAS/class/services/curriculum_content_resolver.py#162-196) and [_get_curriculum_session](file:///c:/Users/piyus/CLAS/CLAS/class/services/curriculum_content_resolver.py#215-230).
    - Replace any remaining emojis in log messages.

## Verification Plan

### Automated Tests
- Access [api_session_state](file:///c:/Users/piyus/CLAS/CLAS/class/views.py#5891-6044) and verify it returns correct prep checklist status.
- Access [today_session](file:///c:/Users/piyus/CLAS/CLAS/class/views.py#1182-1675) and monitor query count/loading time using Django Debug Toolbar or custom logging.
- Check logs for any remaining `UnicodeEncodeError` after session conduct/cancel.

### Manual Verification
- Compare [today_session.html](file:///c:/Users/piyus/CLAS/CLAS/old_today_session.html) load times before and after optimizations.
- Verify that progress bar updates correctly after conducting a session (cache invalidation check).
- Verify that grouped sessions still show correctly for all classes in a group.
