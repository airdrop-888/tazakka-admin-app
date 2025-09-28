// frontend/src/components/StyledDatePicker.jsx (File Baru)

import React from 'react';
import DatePicker from 'react-datepicker';
import { FiCalendar } from 'react-icons/fi';
import "react-datepicker/dist/react-datepicker.css";
import "./StyledDatePicker.css"; // File CSS kustom kita

// Komponen input kustom agar bisa menampilkan ikon kalender
const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
  <button className="custom-datepicker-input" onClick={onClick} ref={ref}>
    {value}
    <FiCalendar />
  </button>
));

const StyledDatePicker = ({ selectedDate, onChange }) => {
  return (
    <DatePicker
      selected={selectedDate}
      onChange={onChange}
      customInput={<CustomInput />}
      dateFormat="dd/MM/yyyy"
      calendarClassName="custom-calendar"
    />
  );
};

export default StyledDatePicker;