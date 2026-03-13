export interface NotificationMessage {
    uuid?: string;
    id?: string;
    titre?: string;
    message?: string;
    type?: string;
    lu?: boolean;
    destinataire?: string;
    lienAction?: string;
    createdAt?: string;
    updatedAt?: string;
    create?: string;
    update?: string;
}

export interface NotificationSetting {
    uuid?: string;
    id?: string;

    // Toggles
    autoSendSms?: boolean;
    autoSendEmail?: boolean;
    autoSendWhatsapp?: boolean;
    enablePushNotifications?: boolean;

    // Templates
    smsTemplateWelcome?: string;
    smsTemplateLatePayment?: string;
    smsTemplateMaintenance?: string;

    // Timestamps
    createdAt?: string;
    updatedAt?: string;
}
