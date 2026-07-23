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
export type RequestStatus = "new" | "accepted" | "declined" | "proposed" | "fulfilled";
export type MessageSender = "supplier" | "store_owner" | "system";
export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";
export type PlanTier = "free" | "basic" | "premium" | "full";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";
export type StoreType = "shopify_shopify_theme" | "shopify_liquid_theme" | "own_platform";
export type StoreStatus = "draft" | "building" | "ready_for_review" | "live" | "archived";
export type ShopifyStoreStatus =
  | "available"
  | "assigned"
  | "building"
  | "ready_for_review"
  | "client_approved"
  | "waiting_for_transfer"
  | "transferred"
  | "archived";
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
      product_requests: {
        Row: {
          id: string;
          supplier_id: string;
          store_name: string | null;
          store_owner_name: string | null;
          store_owner_email: string | null;
          timeline: string | null;
          note: string | null;
          status: RequestStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          supplier_id: string;
        } & Partial<Omit<Database["public"]["Tables"]["product_requests"]["Row"], "supplier_id">>;
        Update: Partial<Database["public"]["Tables"]["product_requests"]["Row"]>;
        Relationships: [];
      };
      request_items: {
        Row: {
          id: string;
          request_id: string;
          product_id: string | null;
          product_name: string;
          quantity: number;
        };
        Insert: {
          request_id: string;
          product_name: string;
          product_id?: string | null;
          quantity?: number;
        };
        Update: Partial<Database["public"]["Tables"]["request_items"]["Row"]>;
        Relationships: [];
      };
      request_messages: {
        Row: {
          id: string;
          request_id: string;
          sender: MessageSender;
          body: string;
          created_at: string;
        };
        Insert: {
          request_id: string;
          sender: MessageSender;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["request_messages"]["Row"]>;
        Relationships: [];
      };
      supplier_members: {
        Row: {
          id: string;
          supplier_id: string;
          user_id: string | null;
          invited_email: string;
          role: UserRole;
          status: "invited" | "active" | "revoked";
          created_at: string;
        };
        Insert: {
          supplier_id: string;
          invited_email: string;
          user_id?: string | null;
          role?: UserRole;
          status?: "invited" | "active" | "revoked";
        };
        Update: Partial<Database["public"]["Tables"]["supplier_members"]["Row"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          user_id: string;
          plan: PlanTier;
          status: SubscriptionStatus;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          current_period_end: string | null;
          trial_ends_at: string | null;
          promo_eligible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: { user_id: string } & Partial<
          Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "user_id">
        >;
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]>;
        Relationships: [];
      };
      usage_daily: {
        Row: { user_id: string; day: string; tokens_used: number };
        Insert: { user_id: string; day?: string; tokens_used?: number };
        Update: Partial<Database["public"]["Tables"]["usage_daily"]["Row"]>;
        Relationships: [];
      };
      shopify_stores: {
        Row: {
          id: string;
          shop_domain: string;
          shopify_shop_id: string | null;
          access_token: string | null;
          scopes: string | null;
          status: ShopifyStoreStatus;
          owner_user_id: string | null;
          assigned_at: string | null;
          transferred_at: string | null;
          theme_id: string | null;
          sync_status: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: { shop_domain: string } & Partial<
          Omit<Database["public"]["Tables"]["shopify_stores"]["Row"], "shop_domain">
        >;
        Update: Partial<Database["public"]["Tables"]["shopify_stores"]["Row"]>;
        Relationships: [];
      };
      stores: {
        Row: {
          id: string;
          user_id: string;
          type: StoreType;
          name: string | null;
          status: StoreStatus;
          domain: string | null;
          subdomain: string | null;
          theme: string | null;
          shopify_store_id: string | null;
          live_url: string | null;
          logo_url: string | null;
          content: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: { user_id: string; type: StoreType } & Partial<
          Omit<Database["public"]["Tables"]["stores"]["Row"], "user_id" | "type">
        >;
        Update: Partial<Database["public"]["Tables"]["stores"]["Row"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          number: number;
          supplier_id: string;
          request_id: string | null;
          store_name: string | null;
          store_owner_name: string | null;
          store_owner_email: string | null;
          shipping: string | null;
          status: OrderStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          supplier_id: string;
        } & Partial<Omit<Database["public"]["Tables"]["orders"]["Row"], "supplier_id" | "number">>;
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          quantity: number;
          unit_price: number | null;
        };
        Insert: {
          order_id: string;
          product_name: string;
          product_id?: string | null;
          quantity?: number;
          unit_price?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
        Relationships: [];
      };
      selected_products: {
        Row: { user_id: string; product_id: string; created_at: string };
        Insert: { user_id: string; product_id: string };
        Update: Partial<Database["public"]["Tables"]["selected_products"]["Row"]>;
        Relationships: [];
      };
      store_products: {
        Row: { store_id: string; product_id: string; price: number | null; created_at: string };
        Insert: { store_id: string; product_id: string; price?: number | null };
        Update: Partial<Database["public"]["Tables"]["store_products"]["Row"]>;
        Relationships: [];
      };
      store_orders: {
        Row: {
          id: string;
          store_id: string;
          customer_name: string | null;
          customer_email: string | null;
          shipping: string | null;
          subtotal: number | null;
          items: { product_id: string | null; supplier_id: string | null; name: string; quantity: number; unit_price: number | null }[];
          status: string;
          stripe_session_id: string | null;
          created_at: string;
        };
        Insert: {
          store_id: string;
        } & Partial<Omit<Database["public"]["Tables"]["store_orders"]["Row"], "id" | "store_id" | "created_at">>;
        Update: Partial<Database["public"]["Tables"]["store_orders"]["Row"]>;
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
export type ProductRequest = Database["public"]["Tables"]["product_requests"]["Row"];
export type RequestItem = Database["public"]["Tables"]["request_items"]["Row"];
export type RequestMessage = Database["public"]["Tables"]["request_messages"]["Row"];
export type SupplierMember = Database["public"]["Tables"]["supplier_members"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type UsageDaily = Database["public"]["Tables"]["usage_daily"]["Row"];
export type ShopifyStore = Database["public"]["Tables"]["shopify_stores"]["Row"];
export type Store = Database["public"]["Tables"]["stores"]["Row"];
