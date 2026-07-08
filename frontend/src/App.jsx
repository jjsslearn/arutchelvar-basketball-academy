import './App.css';
import StudentForm from './components/StudentForm';
import AttendanceForm from './components/AttendanceForm';
import BatchManagement from './components/BatchManagement';
import FeesForm from './components/FeesForm';
import PrintCards from './components/PrintCards';
import AttendanceReport from './components/AttendanceReport';

function App() {
  return (
    <div className="App">
      <h1 className="no-print">Arutchelvar Basketball Academy</h1>

      <div className="no-print">
        <StudentForm />
        <hr />
        <BatchManagement />
        <hr />
        <AttendanceForm />
        <hr />
        <FeesForm />
        <hr />
      </div>

      <PrintCards />
      <AttendanceReport />
    </div>
  );
}

export default App;