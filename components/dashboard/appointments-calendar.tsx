'use client'

import { useMemo } from 'react'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import type { Appointment } from '@/types'

moment.locale('es')
const localizer = momentLocalizer(moment)

const STATUS_COLORS: Record<string, string> = {
  pendiente:   '#f59e0b',
  en_progreso: '#3b82f6',
  completada:  '#10b981',
  cancelada:   '#ef4444',
}

const SERVICE_LABELS: Record<string, string> = {
  revision_general:    'Revisión general',
  cambio_aceite:       'Cambio aceite',
  frenos:              'Frenos',
  neumaticos:          'Neumáticos',
  aire_acondicionado:  'Aire acondicionado',
  carroceria:          'Carrocería',
  diagnostico:         'Diagnóstico',
  otro:                'Otro',
}

interface CalEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Appointment
}

interface Props {
  appointments: Appointment[]
  getClientName: (id: string) => string
  onSelectEvent: (appt: Appointment) => void
  defaultView?: 'week' | 'day' | 'agenda' | 'month'
}

const MESSAGES = {
  allDay:        'Todo el día',
  previous:      'Anterior',
  next:          'Siguiente',
  today:         'Hoy',
  month:         'Mes',
  week:          'Semana',
  day:           'Día',
  agenda:        'Agenda',
  date:          'Fecha',
  time:          'Hora',
  event:         'Evento',
  noEventsInRange: 'Sin citas en este período',
  showMore:      (count: number) => `+${count} más`,
}

export function AppointmentsCalendar({ appointments, getClientName, onSelectEvent, defaultView = 'week' }: Props) {
  const events = useMemo<CalEvent[]>(() =>
    appointments.map(appt => ({
      id:       appt.id,
      title:    `${getClientName(appt.clientId)} · ${SERVICE_LABELS[appt.serviceType] ?? appt.serviceType}`,
      start:    new Date(appt.date),
      end:      new Date(new Date(appt.date).getTime() + 60 * 60 * 1000),
      resource: appt,
    })),
    [appointments]
  )

  function eventStyleGetter(event: CalEvent) {
    const color = STATUS_COLORS[event.resource.status] ?? '#6b7280'
    return {
      style: {
        backgroundColor: color,
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px',
        padding: '2px 6px',
        opacity: event.resource.status === 'cancelada' ? 0.5 : 1,
      },
    }
  }

  return (
    <div className="h-[600px] [&_.rbc-header]:text-sm [&_.rbc-header]:font-medium [&_.rbc-today]:bg-primary/5 [&_.rbc-event]:cursor-pointer [&_.rbc-off-range-bg]:bg-muted/30 [&_.rbc-toolbar-label]:font-semibold [&_.rbc-btn-group_button]:text-sm">
      <Calendar
        localizer={localizer}
        events={events}
        defaultView={defaultView as typeof Views[keyof typeof Views]}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        startAccessor="start"
        endAccessor="end"
        messages={MESSAGES}
        culture="es"
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event: CalEvent) => onSelectEvent(event.resource)}
        step={30}
        timeslots={2}
        min={new Date(0, 0, 0, 7, 0, 0)}
        max={new Date(0, 0, 0, 21, 0, 0)}
        scrollToTime={new Date(0, 0, 0, 8, 0, 0)}
        popup
      />
    </div>
  )
}
