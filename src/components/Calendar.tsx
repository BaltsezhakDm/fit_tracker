import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  workoutDates: string[]; // ISO date strings (YYYY-MM-DD)
}

const WEEKDAYS = ['пнд', 'втр', 'срд', 'чтв', 'птн', 'суб', 'вск'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export default function Calendar({ selectedDate, onDateSelect, workoutDates }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const calendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of week for the first day (0 = Sunday, 1 = Monday, ...)
    // We want Monday = 0, Tuesday = 1, ..., Sunday = 6
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) startDay = 6; // Sunday

    const grid = [];
    
    // Fill previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      grid.push({
        day: prevMonthLastDay - i,
        month: month - 1,
        year: year,
        isCurrentMonth: false
      });
    }

    // Fill current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      grid.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true
      });
    }

    // Fill next month days
    const remainingSlots = 42 - grid.length; // 6 weeks * 7 days = 42
    for (let i = 1; i <= remainingSlots; i++) {
      grid.push({
        day: i,
        month: month + 1,
        year: year,
        isCurrentMonth: false
      });
    }

    return grid;
  }, [currentMonth]);

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onDateSelect(today);
  };

  const isToday = (day: number, month: number, year: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isSelected = (day: number, month: number, year: number) => {
    return day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
  };

  const hasWorkout = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    return workoutDates.includes(dateStr);
  };

  return (
    <div className="bg-tg-bg text-tg-text p-4 rounded-3xl select-none">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={goToPrevMonth} className="p-1 hover:bg-tg-secondaryBg rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h3 className="text-xl font-bold min-w-[100px]">
            {MONTHS[currentMonth.getMonth()]}
          </h3>
          <button onClick={goToNextMonth} className="p-1 hover:bg-tg-secondaryBg rounded-full transition-colors">
            <ChevronRight size={24} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={goToToday}
            className="text-tg-link font-medium text-sm px-2 py-1"
          >
            Сегодня
          </button>
          <LayoutGrid size={20} className="text-tg-text opacity-80" />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-4 text-center">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-[10px] uppercase font-bold text-tg-hint mb-2">
            {day}
          </div>
        ))}
        
        {calendarGrid.map((item, idx) => {
          const { day, month, year, isCurrentMonth } = item;
          const selected = isSelected(day, month, year);
          const workout = hasWorkout(day, month, year);
          
          return (
            <div 
              key={idx}
              className="flex items-center justify-center relative h-10"
              onClick={() => onDateSelect(new Date(year, month, day))}
            >
              <div className={`
                w-9 h-9 flex items-center justify-center rounded-full text-sm transition-all cursor-pointer
                ${!isCurrentMonth ? 'text-tg-hint opacity-30' : 'text-tg-text'}
                ${selected ? 'bg-tg-link text-white font-bold scale-110 shadow-lg shadow-blue-500/30' : ''}
                ${workout && !selected ? 'border-2 border-tg-link/60 font-semibold' : ''}
                ${isToday(day, month, year) && !selected ? 'text-tg-link font-black' : ''}
              `}>
                {day}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
