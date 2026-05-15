'use client'

import { useMemo, useState } from 'react'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import type { Appointment } from '@/types'
import { Button } from '@/components/ui/button'
import { Users, Calendar as CalendarIcon } from 'lucide-react'

moment.locale('es')
const localizer = momentLocalizer(moment)

const STATUS_COLORS: Record<string, string> = {
  pendiente:   '#f59e0b',
  en_progreso: '#3b82f6',
  completada:  '#10b981',
  cancelada:   '#ef4444',
}

const SERVICE_LABELS: Record<string, string> = {
  revision_general:    'Revisión',
  cambio_aceite:       'Aceite',
  frenos:              'Frenos',
  neumaticos:          'Neumáticos',
  aire_acondicionado:  'Aire Acond.',
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
  resourceId: string
}

interface Mechanic {
  id: string
  name: string
}

interface Props {
  appointments: Appointment[]
  getClientName: (id: string) => string
  mechanics?: Mechanic[]
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

export function AppointmentsCalendar({ appointments, getClientName, mechanics = [], onSelectEvent, defaultView = 'week' }: Props) {
  const [resourceMode, setResourceMode] = useState(false)

  const events = useMemo<CalEvent[]>(() =>
    appointments.map(appt => ({
      id:         appt.id,
      title:      `${getClientName(appt.clientId)} · ${SERVICE_LABELS[appt.serviceType] ?? appt.serviceType}`,
      start:      new Date(appt.date),
      end:        new Date(new Date(appt.date).getTime() + 60 * 60 * 1000),
      resource:   appt,
      resourceId: appt.mechanicId,
    })),
    [appointments, getClientName]
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

  // Resources: one column per mechanic
  const resources = useMemo(() =>
    mechanics.map(m => ({ id: m.id, title: m.name.split(' ')[0] })),
    [mechanics]
  )

  const calendarView = resourceMode
    ? Views.DAY
    : defaultView as typeof Views[keyof typeof Views]

  return (
    <div className="space-y-3">
      {/* Resource mode toggle — only show when mechanics are provided */}
      {mechanics.length > 0 && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">Vista:</p>
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Button
              variant={!resourceMode ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setResourceMode(false)}
            >
              <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
              Semana
            </Button>
            <Button
              variant={resourceMode ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setResourceMode(true)}
            >
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Por mecánico
            </Button>
          </div>
          {resourceMode && (
            <p className="text-xs text-muted-foreground">
              Columna por mecánico · hoy
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries({
          pendiente: 'Pendiente',
          en_progreso: 'En progreso',
          completada: 'Completada',
          cancelada: 'Cancelada',
        }).map(([k, label]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[k] }} />
            {label}
          </div>
        ))}
      </div>

      <div className="h-[580px] rounded-xl overflow-hidden border border-border/50 [&_.rbc-header]:text-xs [&_.rbc-header]:font-semibold [&_.rbc-header]:py-2 [&_.rbc-today]:bg-primary/5 [&_.rbc-event]:cursor-pointer [&_.rbc-off-range-bg]:bg-muted/30 [&_.rbc-toolbar-label]:font-semibold [&_.rbc-toolbar-label]:text-sm [&_.rbc-btn-group_button]:text-xs [&_.rbc-btn-group_button]:px-3 [&_.rbc-time-slot]:text-xs [&_.rbc-time-gutter]:text-xs [&_.rbc-current-time-indicator]:bg-primary [&_.rbc-resource-header]:text-xs [&_.rbc-resource-header]:font-semibold [&_.rbc-resource-header]:py-2 [&_.rbc-resource-header]:bg-muted/30">
        <Calendar
          localizer={localizer}
          events={events}
          view={calendarView}
          onView={() => {}}
          views={resourceMode
            ? { day: true }
            : { month: true, week: true, day: true, agenda: true }
          }
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
          // Resource mode props
          {...(resourceMode && resources.length > 0 ? {
            resources,
            resourceIdAccessor: (r: { id: string; title: string }) => r.id,
            resourceTitleAccessor: (r: { id: string; title: string }) => r.title,
          } : {})}
        />
      </div>
    </div>
  )
}
