// components/Calendar.jsx
import React, { useState } from "react";

export default function Calendar({ onDateSelect, disabledDates = [] }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysInMonth(currentMonth, currentYear) }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth(currentMonth, currentYear) });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onDateSelect(dateStr);
  };

  const isToday = (day) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  return (
    <div style={styles.calendarWrap}>
      <div style={styles.header}>
        <button onClick={handlePrevMonth} style={styles.navBtn}>←</button>
        <div style={styles.monthYear}>{monthNames[currentMonth]} {currentYear}</div>
        <button onClick={handleNextMonth} style={styles.navBtn}>→</button>
      </div>

      <div style={styles.weekdays}>
        {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map(day => (
          <div key={day} style={styles.weekday}>{day}</div>
        ))}
      </div>

      <div style={styles.daysGrid}>
        {emptyDays.map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => (
          <button
            key={day}
            onClick={() => handleDateClick(day)}
            style={{
              ...styles.day,
              ...(isToday(day) ? styles.today : {}),
              ...((day < today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) 
                ? styles.disabled 
                : {})
            }}
            disabled={day < today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  calendarWrap: {
    background: "#1a1f2e",
    border: "1px solid #232a41",
    borderRadius: 12,
    padding: 16,
    maxWidth: 320,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    color: "#e8ecf3",
  },
  monthYear: {
    fontWeight: 600,
    fontSize: 16,
  },
  navBtn: {
    background: "#2a2f42",
    border: "1px solid #323a55",
    color: "#6ee7b7",
    borderRadius: 6,
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: 14,
  },
  weekdays: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 4,
    marginBottom: 8,
  },
  weekday: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: 600,
    color: "#94a3b8",
    padding: "4px 0",
  },
  daysGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 4,
  },
  day: {
    background: "#2a2f42",
    border: "1px solid #323a55",
    color: "#e8ecf3",
    borderRadius: 6,
    padding: "8px 4px",
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.2s",
  },
  today: {
    background: "#6ee7b7",
    color: "#052014",
    fontWeight: 700,
  },
  disabled: {
    opacity: 0.3,
    cursor: "not-allowed",
  },
};