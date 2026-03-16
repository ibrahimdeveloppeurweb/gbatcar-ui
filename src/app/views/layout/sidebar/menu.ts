import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    label: 'GBATCAR - VUE GLOBALE',
    isTitle: true
  },
  {
    label: 'Tableau de Bord',
    icon: 'activity',
    link: '/gbatcar/dashboard',
    nom: 'MENU_DASHBOARD_MAIN'
  },
  {
    label: 'GESTION OPÉRATIONNELLE',
    isTitle: true
  },
  {
    label: 'Clients et Locataires',
    icon: 'users',
    nom: 'MENU_PARENT_CLIENTS',
    subItems: [
      {
        label: 'Tableau de bord',
        link: '/gbatcar/clients/dashboard',
        nom: 'MENU_CLIENTS_DASHBOARD'
      },
      {
        label: 'Tous les Clients',
        link: '/gbatcar/clients',
        nom: 'MENU_CLIENTS_LIST'
      }
    ]
  },
  {
    label: 'Parc Automobile',
    icon: 'truck',
    nom: 'MENU_PARENT_VEHICLES',
    subItems: [
      {
        label: 'Tableau de bord',
        link: '/gbatcar/vehicles/dashboard',
        nom: 'MENU_VEHICLES_DASHBOARD'
      },
      {
        label: 'Catalogue & Arrivages',
        link: '/gbatcar/vehicles/catalog',
        nom: 'MENU_VEHICLES_CATALOG'
      },
      {
        label: 'Flotte Active',
        link: '/gbatcar/vehicles',
        nom: 'MENU_VEHICLES_LIST'
      },
      {
        label: 'Conformité & Visites',
        link: '/gbatcar/vehicles/compliance',
        nom: 'MENU_VEHICLES_COMPLIANCE'
      }
    ]
  },
  {
    label: 'Contrats & Dossiers',
    icon: 'file-text',
    nom: 'MENU_PARENT_CONTRACTS',
    subItems: [
      {
        label: 'Tableau de bord',
        link: '/gbatcar/contracts/dashboard',
        nom: 'MENU_CONTRACTS_DASHBOARD'
      },
      {
        label: 'Tous les Contrats',
        link: '/gbatcar/contracts',
        nom: 'MENU_CONTRACTS_LIST'
      },
      {
        label: 'Suivi des Retards',
        link: '/gbatcar/contracts/late',
        nom: 'MENU_CONTRACTS_LATE'
      }
    ]
  },
  {
    label: 'FINANCES ET ENTRETIEN',
    isTitle: true
  },
  {
    label: 'Paiements & Trésorerie',
    icon: 'dollar-sign',
    nom: 'MENU_PARENT_PAYMENTS',
    subItems: [
      {
        label: 'Tableau de bord',
        link: '/gbatcar/payments/dashboard',
        nom: 'MENU_PAYMENTS_DASHBOARD'
      },
      {
        label: 'Encaissements',
        link: '/gbatcar/payments',
        nom: 'MENU_PAYMENTS_LIST'
      },
      {
        label: 'Gestion des Pénalités',
        link: '/gbatcar/payments/penalties',
        nom: 'MENU_PAYMENTS_PENALTIES'
      }
    ]
  },
  {
    label: 'Maintenance',
    icon: 'tool',
    nom: 'MENU_PARENT_MAINTENANCE',
    subItems: [
      {
        label: 'Tableau de bord',
        link: '/gbatcar/maintenance/dashboard',
        nom: 'MENU_MAINTENANCE_DASHBOARD'
      },
      {
        label: 'Interventions',
        link: '/gbatcar/maintenance',
        nom: 'MENU_MAINTENANCE_LIST'
      },
      {
        label: 'Alertes Sinistres',
        link: '/gbatcar/maintenance/alerts',
        nom: 'MENU_MAINTENANCE_ALERTS'
      }
    ]
  },
  {
    label: 'CONFIGURATION',
    isTitle: true
  },



  {
    label: 'Administration',
    icon: 'settings',
    nom: 'MENU_PARENT_ADMIN',
    subItems: [
      {
        label: 'Tableau de bord',
        link: '/gbatcar/admin/dashboard',
        nom: 'MENU_ADMIN_DASHBOARD'
      },
      {
        label: 'Collaborateurs',
        link: '/gbatcar/admin/users',
        nom: 'MENU_ADMIN_USERS'
      },
      {
        label: 'Permissions',
        link: '/gbatcar/admin/permissions',
        nom: 'MENU_ADMIN_PERMISSIONS'
      },
      {
        label: 'Paramètres Globaux',
        link: '/gbatcar/admin/settings',
        nom: 'MENU_ADMIN_SETTINGS'
      },
      {
        label: 'Notifications',
        link: '/gbatcar/admin/notifications',
        nom: 'MENU_ADMIN_NOTIFICATIONS'
      },
    ]
  },
  {
    label: 'APPLICATIONS WEB',
    isTitle: true
  },
  {
    label: 'E-mail',
    icon: 'mail',
    nom: 'MENU_PARENT_EMAIL',
    subItems: [
      {
        label: 'Inbox',
        link: '/gbatcar/apps/email/inbox',
        nom: 'MENU_EMAIL_INBOX'
      }
    ]
  },
  {
    label: 'Chat',
    icon: 'message-square',
    link: '/gbatcar/apps/chat',
    nom: 'MENU_APPS_CHAT'
  },
  {
    label: 'Calendrier',
    icon: 'calendar',
    link: '/gbatcar/apps/calendar',
    nom: 'MENU_APPS_CALENDAR',
    badge: {
      variant: 'primary',
      text: 'Événement',
    }
  },
];


