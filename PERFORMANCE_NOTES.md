# Performance

- El homepage renderiza inmediatamente sin bloquear el primer paint esperando Supabase.
- Las consultas de bootstrap de planes solo se montan en `/admin`.
- El hero visible se marca como recurso prioritario (`fetchPriority=high`, `loading=eager`, `decoding=async`).
- El favicon se sirve como archivo estático en lugar de incrustarse en el bundle JavaScript.
- La galería conserva carga diferida (`loading=lazy`).
