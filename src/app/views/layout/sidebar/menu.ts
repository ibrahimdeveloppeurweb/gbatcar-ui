import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    label: 'GBATCAR - VUE GLOBALE',
    isTitle: true
  },
  {
    label: 'Tableau de Bord',
    icon: 'activity',
    link: '/gbatcar/dashboard'
  },
  {
    label: 'GESTION OPÉRATIONNELLE',
    isTitle: true
  },
  {
    label: 'Clients et Locataires',
    icon: 'users',
    link: '/gbatcar/clients'
  },
  {
    label: 'Parc Automobile',
    icon: 'truck',
    subItems: [
      {
        label: 'Catalogue & Arrivages',
        link: '/gbatcar/vehicles/catalog',
      },
      {
        label: 'Flotte Active',
        link: '/gbatcar/vehicles',
      },
      {
        label: 'Conformité & Visites',
        link: '/gbatcar/vehicles/compliance',
      }
    ]
  },
  {
    label: 'Contrats & Dossiers',
    icon: 'file-text',
    subItems: [
      {
        label: 'Tous les Contrats',
        link: '/gbatcar/contracts',
      },
      {
        label: 'Suivi des Retards',
        link: '/gbatcar/contracts/late',
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
    subItems: [
      {
        label: 'Encaissements',
        link: '/gbatcar/payments',
      },
      {
        label: 'Gestion des Pénalités',
        link: '/gbatcar/payments/penalties',
      }
    ]
  },
  {
    label: 'Maintenance VTC',
    icon: 'tool',
    subItems: [
      {
        label: 'Interventions',
        link: '/gbatcar/maintenance',
      },
      {
        label: 'Alertes Sinistres',
        link: '/gbatcar/maintenance/alerts',
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
    subItems: [
      {
        label: 'Collaborateurs',
        link: '/gbatcar/admin/users',
      },
      {
        label: 'Paramètres Globaux',
        link: '/gbatcar/admin/settings',
      },
      {
        label: 'Notifications',
        link: '/gbatcar/admin/notifications',
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
    subItems: [
      {
        label: 'Inbox',
        link: '/gbatcar/apps/email/inbox',
      }
    ]
  },
  {
    label: 'Chat',
    icon: 'message-square',
    link: '/gbatcar/apps/chat',
  },
  {
    label: 'Calendrier',
    icon: 'calendar',
    link: '/gbatcar/apps/calendar',
    badge: {
      variant: 'primary',
      text: 'Événement',
    }
  },
];


