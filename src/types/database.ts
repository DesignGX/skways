/**
 * SK Ways Logistics — typed Supabase schema.
 * Hand-maintained to mirror supabase/migrations/0001_initial.sql.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "CUSTOMER" | "DRIVER" | "ADMIN";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type VehicleType = "BIKE" | "AUTO" | "MINI_TRUCK" | "LCV" | "TRUCK" | "OTHER";
export type VehicleOwnership = "OWNED" | "PARTNER";
export type OrderStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "DRIVER_ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED"
  | "RETURNED";
export type PaymentMethod = "CASH" | "UPI" | "BANK_TRANSFER" | "CARD" | "OTHER";
export type PaymentStatus = "PENDING" | "PAID" | "PARTIAL" | "FAILED" | "REFUNDED";
export type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "OVERDUE" | "CANCELLED";
export type LeadStatus = "NEW" | "CONTACTED" | "QUOTED" | "CONVERTED" | "LOST";
export type OtpType = "PICKUP" | "DELIVERY";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          role: UserRole;
          full_name: string;
          phone: string | null;
          email: string | null;
          avatar_url: string | null;
          status: AccountStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: UserRole;
          full_name?: string;
          phone?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          profile_id: string;
          company_name: string;
          contact_person: string | null;
          phone: string | null;
          email: string | null;
          gst_number: string | null;
          billing_address: string | null;
          status: AccountStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          company_name: string;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          gst_number?: string | null;
          billing_address?: string | null;
          status?: AccountStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      drivers: {
        Row: {
          id: string;
          profile_id: string;
          license_number: string | null;
          license_expiry: string | null;
          address: string | null;
          emergency_contact: string | null;
          emergency_contact_phone: string | null;
          status: AccountStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          license_number?: string | null;
          license_expiry?: string | null;
          address?: string | null;
          emergency_contact?: string | null;
          emergency_contact_phone?: string | null;
          status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["drivers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "drivers_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicles: {
        Row: {
          id: string;
          vehicle_number: string;
          vehicle_type: VehicleType;
          make: string | null;
          model: string | null;
          capacity_kg: number | null;
          driver_id: string | null;
          ownership: VehicleOwnership;
          insurance_expiry: string | null;
          permit_expiry: string | null;
          fitness_expiry: string | null;
          status: AccountStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_number: string;
          vehicle_type: VehicleType;
          make?: string | null;
          model?: string | null;
          capacity_kg?: number | null;
          driver_id?: string | null;
          ownership?: VehicleOwnership;
          insurance_expiry?: string | null;
          permit_expiry?: string | null;
          fitness_expiry?: string | null;
          status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vehicles"]["Insert"]>;
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          customer_id: string;
          label: string;
          contact_name: string | null;
          phone: string | null;
          address_line_1: string;
          address_line_2: string | null;
          city: string;
          state: string;
          postal_code: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          label: string;
          contact_name?: string | null;
          phone?: string | null;
          address_line_1: string;
          address_line_2?: string | null;
          city: string;
          state: string;
          postal_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          tracking_number: string;
          customer_id: string;
          driver_id: string | null;
          vehicle_id: string | null;
          pickup_address_id: string;
          delivery_address_id: string;
          package_type: string;
          weight_kg: number | null;
          number_of_packages: number;
          distance_km: number | null;
          price: number | null;
          status: OrderStatus;
          scheduled_pickup_at: string | null;
          accepted_at: string | null;
          picked_up_at: string | null;
          delivered_at: string | null;
          special_instructions: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          tracking_number?: string;
          customer_id: string;
          driver_id?: string | null;
          vehicle_id?: string | null;
          pickup_address_id: string;
          delivery_address_id: string;
          package_type: string;
          weight_kg?: number | null;
          number_of_packages?: number;
          distance_km?: number | null;
          price?: number | null;
          status?: OrderStatus;
          scheduled_pickup_at?: string | null;
          accepted_at?: string | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
          special_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_pickup_address_id_fkey";
            columns: ["pickup_address_id"];
            isOneToOne: false;
            referencedRelation: "addresses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_delivery_address_id_fkey";
            columns: ["delivery_address_id"];
            isOneToOne: false;
            referencedRelation: "addresses";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: OrderStatus;
          changed_by: string | null;
          notes: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          status: OrderStatus;
          changed_by?: string | null;
          notes?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_status_history"]["Insert"]>;
        Relationships: [];
      };
      order_assignments: {
        Row: {
          id: string;
          order_id: string;
          driver_id: string | null;
          vehicle_id: string | null;
          assigned_by: string | null;
          action: string;
          notes: string | null;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          driver_id?: string | null;
          vehicle_id?: string | null;
          assigned_by?: string | null;
          action?: string;
          notes?: string | null;
          assigned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_assignments"]["Insert"]>;
        Relationships: [];
      };
      order_otps: {
        Row: {
          id: string;
          order_id: string;
          type: OtpType;
          otp_hash: string;
          expires_at: string;
          attempts: number;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          type: OtpType;
          otp_hash: string;
          expires_at: string;
          attempts?: number;
          used_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_otps"]["Insert"]>;
        Relationships: [];
      };
      pricing_rules: {
        Row: {
          id: string;
          name: string;
          vehicle_type: VehicleType;
          base_fare: number;
          per_km_rate: number;
          per_kg_rate: number;
          waiting_charge: number;
          extra_stop_charge: number;
          minimum_fare: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          vehicle_type: VehicleType;
          base_fare: number;
          per_km_rate: number;
          per_kg_rate: number;
          waiting_charge?: number;
          extra_stop_charge?: number;
          minimum_fare?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pricing_rules"]["Insert"]>;
        Relationships: [];
      };
payments: {
        Row: {
          id: string;
          order_id: string;
          customer_id: string;
          amount: number;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          transaction_reference: string | null;
          notes: string | null;
          recorded_by: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          customer_id: string;
          amount: number;
          payment_method: PaymentMethod;
          payment_status?: PaymentStatus;
          transaction_reference?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          customer_id: string;
          order_id: string;
          subtotal: number;
          tax: number;
          discount: number;
          total: number;
          status: InvoiceStatus;
          issued_at: string | null;
          due_at: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number?: string;
          customer_id: string;
          order_id: string;
          subtotal: number;
          tax?: number;
          discount?: number;
          total?: number;
          status?: InvoiceStatus;
          issued_at?: string | null;
          due_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          business_name: string;
          contact_name: string;
          phone: string;
          email: string | null;
          service: string | null;
          message: string | null;
          status: LeadStatus;
          source: string | null;
          quote_request_number: string | null;
          pickup_address: string | null;
          delivery_address: string | null;
          pickup_date: string | null;
          package_type: string | null;
          weight: string | null;
          number_of_packages: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_name: string;
          contact_name: string;
          phone: string;
          email?: string | null;
          service?: string | null;
          message?: string | null;
          status?: LeadStatus;
          source?: string | null;
          quote_request_number?: string | null;
          pickup_address?: string | null;
          delivery_address?: string | null;
          pickup_date?: string | null;
          package_type?: string | null;
          weight?: string | null;
          number_of_packages?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };
notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string | null;
          type: string;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body?: string | null;
          type?: string;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Insert"]>;
        Relationships: [];
      };
      delivery_proofs: {
        Row: {
          id: string;
          order_id: string;
          driver_id: string | null;
          photo_url: string | null;
          signature_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          driver_id?: string | null;
          photo_url?: string | null;
          signature_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["delivery_proofs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_profile_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_current_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      verify_order_otp: {
        Args: { p_order_id: string; p_otp_type: OtpType; p_otp: string };
        Returns: boolean;
      };
      create_order_otp: {
        Args: { p_order_id: string; p_otp_type: OtpType };
        Returns: string;
      };
      assign_driver_to_order: {
        Args: { p_order_id: string; p_driver_id: string; p_vehicle_id?: string | null; p_notes?: string | null };
        Returns: void;
      };
      admin_update_order_status: {
        Args: { p_order_id: string; p_new_status: OrderStatus; p_notes?: string | null };
        Returns: void;
      };
      driver_accept_order: {
        Args: { p_order_id: string };
        Returns: void;
      };
      driver_update_order_status: {
        Args: {
          p_order_id: string;
          p_new_status: OrderStatus;
          p_otp?: string | null;
          p_otp_type?: OtpType;
          p_notes?: string | null;
          p_latitude?: number | null;
          p_longitude?: number | null;
        };
        Returns: void;
      };
      create_notification: {
        Args: { p_user_id: string; p_title: string; p_body?: string | null; p_type?: string; p_link?: string | null };
        Returns: void;
      };
      log_activity: {
        Args: {
          p_user_id: string;
          p_action: string;
          p_entity_type?: string | null;
          p_entity_id?: string | null;
          p_metadata?: unknown;
        };
        Returns: void;
      };
    };
    Enums: {
      user_role: UserRole;
      account_status: AccountStatus;
      vehicle_type: VehicleType;
      vehicle_ownership: VehicleOwnership;
      order_status: OrderStatus;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      invoice_status: InvoiceStatus;
      lead_status: LeadStatus;
      otp_type: OtpType;
    };
    CompositeTypes: Record<string, never>;
  };
};





