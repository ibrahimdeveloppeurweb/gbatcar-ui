import { NgStyle, DatePipe, NgIf } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';

import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventApi } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { Draggable } from '@fullcalendar/interaction'; // for dateClick
import frLocale from '@fullcalendar/core/locales/fr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { CalendarService } from '../../../../../core/services/calendar/calendar.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    NgStyle,
    NgIf,
    FormsModule,
    DatePipe,
    FullCalendarModule
  ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements OnInit {

  eventsList: any[] = [];
  eventTitle: string = '';
  eventStartDate: string = '';
  selectedEvent: any;
  isEditingEvent: boolean = false;
  editEventTitle: string = '';

  @ViewChild('eventModal') eventModal: any;
  @ViewChild('eventDetailModal') eventDetailModal: any;
  modalReference: any;

  calendarOptions: CalendarOptions = {
    plugins: [
      dayGridPlugin,
      timeGridPlugin,
      listPlugin,
      interactionPlugin
    ],
    headerToolbar: {
      left: 'prev,today,next',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    locale: frLocale,
    initialView: 'dayGridMonth',
    events: this.fetchEvents.bind(this), // Fetch events dynamically
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventDrop: this.handleEventDrop.bind(this),
    eventResize: this.handleEventResize.bind(this),
    eventsSet: this.handleEvents.bind(this)
  };

  currentEvents: EventApi[] = [];

  constructor(
    private calendarService: CalendarService,
    private modalService: NgbModal,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
  }

  fetchEvents(fetchInfo: any, successCallback: any, failureCallback: any) {
    this.calendarService.getEvents().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          successCallback(res.data);
        } else {
          successCallback([]);
        }
      },
      error: (err: any) => {
        console.error('Failed to load events', err);
        failureCallback(err);
      }
    });
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    this.eventTitle = '';
    this.eventStartDate = selectInfo.startStr;
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();

    this.modalReference = this.modalService.open(this.eventModal, { centered: true });
    this.modalReference.result.then((result: any) => {
      if (result === 'save' && this.eventTitle) {
        this.saveEvent(selectInfo);
      }
    }, () => { });
  }

  saveEvent(selectInfo: DateSelectArg) {
    const payload = {
      title: this.eventTitle,
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
      backgroundColor: 'rgba(0,204,204,.25)',
      borderColor: '#00cccc'
    };

    this.calendarService.createEvent(payload).subscribe({
      next: (res: any) => {
        selectInfo.view.calendar.addEvent({
          id: res.id,
          title: payload.title,
          start: payload.start,
          end: payload.end,
          allDay: payload.allDay,
          backgroundColor: payload.backgroundColor,
          borderColor: payload.borderColor
        });
      },
      error: (err: any) => console.error('Error creating event', err)
    });
  }

  handleEventClick(clickInfo: EventClickArg) {
    this.selectedEvent = {
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.start,
      backgroundColor: clickInfo.event.backgroundColor,
      borderColor: clickInfo.event.borderColor,
      _ref: clickInfo.event
    };
    this.isEditingEvent = false;
    this.editEventTitle = clickInfo.event.title;
    this.modalService.open(this.eventDetailModal, { centered: true });
  }

  startEditEvent() {
    this.isEditingEvent = true;
  }

  saveEditedEvent(modal: any) {
    if (!this.editEventTitle || !this.selectedEvent) { return; }
    const payload = { title: this.editEventTitle };
    this.calendarService.updateEvent(this.selectedEvent.id, payload).subscribe({
      next: () => {
        this.selectedEvent._ref.setProp('title', this.editEventTitle);
        this.isEditingEvent = false;
        modal.close();
      },
      error: (err: any) => console.error('Error updating event title', err)
    });
  }

  confirmDeleteEvent(modal: any) {
    this.calendarService.deleteEvent(this.selectedEvent.id).subscribe({
      next: () => {
        this.selectedEvent._ref.remove();
        modal.close();
      },
      error: (err: any) => console.error('Error deleting event', err)
    });
  }

  handleEventDrop(dropInfo: any) {
    this.updateEventDates(dropInfo.event);
  }

  handleEventResize(resizeInfo: any) {
    this.updateEventDates(resizeInfo.event);
  }

  updateEventDates(event: any) {
    const payload = {
      start: event.startStr,
      end: event.endStr,
      allDay: event.allDay
    };

    this.calendarService.updateEvent(event.id, payload).subscribe({
      next: () => console.log('Event updated'),
      error: (err: any) => {
        console.error('Error updating event', err);
        event.revert();
      }
    });
  }

  handleEvents(events: EventApi[]) {
    this.currentEvents = events;
    this.cd.detectChanges();
  }

}
