import {
  createPlan,
  deletePhoto,
  deletePlan,
  getAdminContent,
  getPublicContent,
  listPhotos,
  listPlans,
  saveAdminContent,
  updatePlan,
  uploadPhoto,
} from "@/lib/site-api";

type ApiError = { message: string } | null;
type Result<T = any> = { data: T; error: ApiError };
type Filter = { kind: "eq"; column: string; value: any } | { kind: "in"; column: string; value: any[] };

const pendingUploads = new Map<string, File>();

function failure(error: unknown): Result<null> {
  return { data: null, error: { message: (error as any)?.message || "Error de persistencia" } };
}

class QueryBuilder implements PromiseLike<Result<any>> {
  private action: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: any = null;
  private filters: Filter[] = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private maxRows: number | null = null;

  constructor(private table: string) {}

  select(_columns = "*") { this.action = "select"; return this; }
  insert(payload: any) { this.action = "insert"; this.payload = payload; return this; }
  update(payload: any) { this.action = "update"; this.payload = payload; return this; }
  delete() { this.action = "delete"; return this; }
  upsert(payload: any, _options?: any) { this.action = "upsert"; this.payload = payload; return this; }
  eq(column: string, value: any) { this.filters.push({ kind: "eq", column, value }); return this; }
  in(column: string, value: any[]) { this.filters.push({ kind: "in", column, value }); return this; }
  order(column: string, options?: { ascending?: boolean }) { this.orderBy = { column, ascending: options?.ascending !== false }; return this; }
  limit(value: number) { this.maxRows = value; return this; }

  async maybeSingle(): Promise<Result<any | null>> {
    const result = await this.execute();
    if (result.error) return result;
    const rows = Array.isArray(result.data) ? result.data : result.data == null ? [] : [result.data];
    return { data: rows[0] ?? null, error: null };
  }

  then<TResult1 = Result<any>, TResult2 = never>(
    onfulfilled?: ((value: Result<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private eqValue(column: string) {
    const filter = this.filters.find((item): item is Extract<Filter, { kind: "eq" }> => item.kind === "eq" && item.column === column);
    return filter?.value;
  }

  private inValues(column: string) {
    const filter = this.filters.find((item): item is Extract<Filter, { kind: "in" }> => item.kind === "in" && item.column === column);
    return filter?.value;
  }

  private applyFilters(rows: any[]) {
    let output = rows.filter((row) => this.filters.every((filter) => filter.kind === "eq" ? row?.[filter.column] === filter.value : filter.value.includes(row?.[filter.column])));
    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      output = [...output].sort((a, b) => {
        const av = a?.[column]; const bv = b?.[column];
        if (av === bv) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return (av < bv ? -1 : 1) * (ascending ? 1 : -1);
      });
    }
    if (this.maxRows != null) output = output.slice(0, this.maxRows);
    return output;
  }

  private async selectRows() {
    if (this.table === "site_content") {
      const lang = this.eqValue("lang");
      if (lang === "es" || lang === "pt") {
        const { content } = await getPublicContent(lang);
        return [{ lang, data: content }];
      }
      const requested = this.inValues("lang")?.filter((value): value is "es" | "pt" => value === "es" || value === "pt");
      const { rows } = await getAdminContent(requested?.length ? requested : ["es", "pt"]);
      return rows;
    }

    if (this.table === "plans") {
      if (this.eqValue("active") === true) {
        const { plans } = await getPublicContent("es");
        return this.applyFilters(plans);
      }
      const { plans } = await listPlans();
      return this.applyFilters(plans);
    }

    if (this.table === "site_photos") {
      const { photos } = await listPhotos();
      return this.applyFilters(photos);
    }

    throw new Error(`Tabla no soportada: ${this.table}`);
  }

  private async execute(): Promise<Result<any>> {
    try {
      if (this.action === "select") {
        const rows = await this.selectRows();
        return { data: this.table === "site_content" ? this.applyFilters(rows) : rows, error: null };
      }

      if (this.table === "site_content" && this.action === "upsert") {
        const items = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((row: any) => ({ lang: row.lang, data: row.data }));
        const { rows } = await saveAdminContent(items);
        return { data: Array.isArray(this.payload) ? rows : rows[0] ?? null, error: null };
      }

      if (this.table === "plans") {
        if (this.action === "insert") {
          const items = Array.isArray(this.payload) ? this.payload : [this.payload];
          const created = [];
          for (const item of items) created.push((await createPlan(item)).plan);
          return { data: Array.isArray(this.payload) ? created : created[0] ?? null, error: null };
        }
        const id = String(this.eqValue("id") || "");
        if (!id) throw new Error("Falta id del plan");
        if (this.action === "update") return { data: (await updatePlan(id, this.payload)).plan, error: null };
        if (this.action === "delete") { await deletePlan(id); return { data: null, error: null }; }
      }

      if (this.table === "site_photos") {
        if (this.action === "insert") {
          const item = Array.isArray(this.payload) ? this.payload[0] : this.payload;
          const path = String(item?.storage_path || "");
          const file = pendingUploads.get(path);
          if (!file) throw new Error("No se encontró el archivo pendiente para guardar");
          const { photo } = await uploadPhoto(file, {
            storage_path: path,
            slot: String(item?.slot || `photo-${Date.now()}`),
            alt_es: item?.alt_es ?? null,
            alt_pt: item?.alt_pt ?? null,
          });
          pendingUploads.delete(path);
          return { data: photo, error: null };
        }
        if (this.action === "delete") {
          const id = String(this.eqValue("id") || "");
          if (id) await deletePhoto(id);
          return { data: null, error: null };
        }
      }

      throw new Error(`Operación no soportada: ${this.table}/${this.action}`);
    } catch (error) {
      return failure(error);
    }
  }
}

export const supabase = {
  from(table: string) { return new QueryBuilder(table); },
  storage: {
    from(_bucket: string) {
      return {
        async upload(path: string, file: File) {
          pendingUploads.set(path, file);
          return { data: { path }, error: null as ApiError };
        },
        getPublicUrl(path: string) {
          return { data: { publicUrl: `/api/assets/${encodeURIComponent(path)}` } };
        },
        async remove(paths: string[]) {
          try {
            const { photos } = await listPhotos();
            for (const path of paths) {
              pendingUploads.delete(path);
              const row = photos.find((photo) => photo.storage_path === path);
              if (row) await deletePhoto(row.id);
            }
            return { data: paths, error: null as ApiError };
          } catch (error) {
            return failure(error);
          }
        },
      };
    },
  },
};
