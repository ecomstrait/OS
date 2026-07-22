/** Platform roles (RBAC — Doc 14). Extend as new roles are introduced. */
export type UserRole =
  | "admin"
  | "supplier"
  | "supplier_staff"
  | "business_owner"
  | "customer";

export type SupplierStatus = "pending" | "in_review" | "approved" | "rejected";
export type ProductStatus = "draft" | "published";
export type ProductVariant = { name: string; options: string[] };
export type DocumentType =
  | "business_registration"
  | "tax_registration"
  | "national_id"
  | "company_logo"
  | "address_proof";

/**
 * Typed schema for the Supabase client. Grow this table-by-table as the schema
 * lands (or generate via `supabase gen types typescript`).
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          role: UserRole;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: { user_id: string; role?: UserRole; full_name?: string | null };
        Update: { role?: UserRole; full_name?: string | null };
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: string;
          owner_user_id: string;
          business_name: string | null;
          business_type: string | null;
          contact_person: string | null;
          phone: string | null;
          country: string | null;
          city: string | null;
          website: string | null;
          years_in_business: string | null;
          product_categories: string[];
          number_of_products: string | null;
          manufacturing_type: string | null;
          description: string | null;
          estimated_inventory_size: string | null;
          average_lead_time: string | null;
          shipping_regions: string[];
          min_order_quantity: string | null;
          marketing_opt_in: boolean;
          terms_accepted_at: string | null;
          status: SupplierStatus;
          onboarding_step: number;
          quality_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          owner_user_id: string;
        } & Partial<Omit<Database["public"]["Tables"]["suppliers"]["Row"], "owner_user_id">>;
        Update: Partial<Database["public"]["Tables"]["suppliers"]["Row"]>;
        Relationships: [];
      };
      supplier_verification: {
        Row: {
          supplier_id: string;
          email_verified_at: string | null;
          phone_verified_at: string | null;
          documents_verified_at: string | null;
          manual_reviewed_at: string | null;
          badge_granted_at: string | null;
          updated_at: string;
        };
        Insert: { supplier_id: string } & Partial<
          Database["public"]["Tables"]["supplier_verification"]["Row"]
        >;
        Update: Partial<Database["public"]["Tables"]["supplier_verification"]["Row"]>;
        Relationships: [];
      };
      supplier_documents: {
        Row: {
          id: string;
          supplier_id: string;
          type: DocumentType;
          storage_path: string;
          status: "uploaded" | "verified" | "rejected";
          created_at: string;
        };
        Insert: {
          supplier_id: string;
          type: DocumentType;
          storage_path: string;
          status?: "uploaded" | "verified" | "rejected";
        };
        Update: Partial<Database["public"]["Tables"]["supplier_documents"]["Row"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          supplier_id: string;
          title: string;
          description: string | null;
          category: string | null;
          images: string[];
          sku: string | null;
          wholesale_price: number | null;
          retail_price: number | null;
          stock: number;
          reserved: number;
          low_stock_threshold: number;
          status: ProductStatus;
          seo_title: string | null;
          seo_description: string | null;
          variants: ProductVariant[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          supplier_id: string;
          title: string;
        } & Partial<Omit<Database["public"]["Tables"]["products"]["Row"], "supplier_id" | "title">>;
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Relationships: [];
      };
      inventory_adjustments: {
        Row: {
          id: string;
          product_id: string;
          delta: number;
          reason: string | null;
          resulting_stock: number;
          created_at: string;
        };
        Insert: {
          product_id: string;
          delta: number;
          resulting_stock: number;
          reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_adjustments"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { user_role: UserRole };
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
export type SupplierVerification =
  Database["public"]["Tables"]["supplier_verification"]["Row"];
export type SupplierDocument =
  Database["public"]["Tables"]["supplier_documents"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type InventoryAdjustment =
  Database["public"]["Tables"]["inventory_adjustments"]["Row"];
