// Emergency SOS System Type Definitions

export type AlertType = 'lost_pet' | 'emergency_help' | 'found_pet' | 'other';
export type AlertStatus = 'active' | 'resolved' | 'cancelled';
export type ResponseStatus = 'pending' | 'accepted' | 'declined' | 'completed';
export type ServiceType =
    | 'veterinary'
    | 'animal_hospital'
    | 'emergency_vet'
    | 'pet_shop'
    | 'pet_groomer'
    | 'pet_hotel'
    | 'pet_training'
    | 'pet_pharmacy'
    | 'other';

export interface EmergencyAlert {
    id: string;
    user_id: string;
    user_name: string;
    user_avatar: string;
    alert_type: AlertType;
    title: string;
    description: string;
    status: AlertStatus;
    latitude: number;
    longitude: number;
    location_address?: string;
    pet_id?: string;
    pet_name?: string;
    pet_breed?: string;
    pet_description?: string;
    pet_image_url?: string;
    contact_phone?: string;
    contact_method: 'chat' | 'phone' | 'both';
    view_count: number;
    response_count: number;
    created_at: string;
    distance_km?: number;
}

export interface CreateAlertRequest {
    alert_type: AlertType;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    location_address?: string;
    pet_id?: string;
    pet_name?: string;
    pet_breed?: string;
    pet_description?: string;
    pet_image_url?: string;
    contact_phone?: string;
    contact_method?: 'chat' | 'phone' | 'both';
}

export interface AlertResponse {
    id: string;
    alert_id: string;
    responder_id: string;
    responder_name: string;
    responder_avatar: string;
    message?: string;
    status: ResponseStatus;
    responder_latitude?: number;
    responder_longitude?: number;
    created_at: string;
    distance_km?: number;
}

export interface CreateResponseRequest {
    alert_id: string;
    message?: string;
    responder_latitude?: number;
    responder_longitude?: number;
}

export interface AlertNotification {
    id: string;
    alert_id: string;
    alert: EmergencyAlert;
    is_read: boolean;
    distance_km: number;
    created_at: string;
}

export interface PetService {
    id: string;
    name: string;
    service_type: ServiceType;
    description?: string;
    phone: string;
    email?: string;
    website?: string;
    address: string;
    latitude: number;
    longitude: number;
    city?: string;
    country: string;
    hours?: string;
    services?: string[];
    is_24_7: boolean;
    is_verified: boolean;
    rating: number;
    review_count: number;
    distance_km?: number;
    created_at: string;
}

export interface NearbyAlertsResponse {
    alerts: EmergencyAlert[];
    count: number;
}

export interface NearbyServicesResponse {
    services: PetService[];
    count: number;
}

export interface UpdateAlertRequest {
    alert_id: string;
    status: AlertStatus;
    resolved_by?: string;
}
