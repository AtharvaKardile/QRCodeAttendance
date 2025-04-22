import React, {useContext, useEffect, useState} from 'react';
import {AuthContext} from '../App';
import api from './api.jsx';

// Reusable Form Component
const FormComponent = ({fields, initialData = {}, onSubmit, submitText = "Submit", loading, error}) => {
    const [formData, setFormData] = useState(initialData);

    // Update formData when initialData changes (e.g., for editing)
    useEffect(() => {
        setFormData(initialData);
    }, [initialData]);


    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded bg-gray-50">
            {fields.map(field => (
                <div key={field.name}>
                    <label htmlFor={field.name}
                           className="block text-sm font-medium text-gray-700">{field.label}</label>
                    <input
                        type={field.type || 'text'}
                        name={field.name}
                        id={field.name}
                        required={field.required !== false} // Default to true if not specified
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder={field.placeholder || ''}
                    />
                </div>
            ))}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
                {loading ? 'Processing...' : submitText}
            </button>
        </form>
    );
};

// Reusable Table Component
const TableComponent = ({columns, data, loading, error}) => {
    if (loading) return <p>Loading data...</p>;
    if (error) return <p className="text-red-500 bg-red-100 p-3 rounded">{error}</p>;
    if (!data || data.length === 0) return <p className="text-gray-500">No data available.</p>;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    {columns.map(col => (
                        <th key={col.key} scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{col.header}</th>
                    ))}
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {columns.map(col => (
                            <td key={`${rowIndex}-${col.key}`}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row[col.key]}</td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};


function AdminDashboard() {
    const {auth} = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('classes'); // 'classes', 'divisions', 'courses'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Data states
    const [classes, setClasses] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [courses, setCourses] = useState([]);

    // Form states
    const [formError, setFormError] = useState('');

    // Fetch data based on active tab
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            setSuccess('');
            try {
                let response;
                if (activeTab === 'classes') {
                    // API Call: Get all classes
                    response = await api.getClasses();
                    setClasses(response);
                } else if (activeTab === 'divisions') {
                    // API Call: Get all divisions
                    response = await api.getDivisions();
                    setDivisions(response);
                    // Also fetch classes for the division form dropdown (optional but good UX)
                    const classData = await api.getClasses();
                    setClasses(classData);
                } else if (activeTab === 'courses') {
                    // API Call: Get all courses
                    response = await api.getCourses();
                    setCourses(response);
                    // Also fetch classes for the course form dropdown
                    const classData = await api.getClasses();
                    setClasses(classData);
                }
            } catch (err) {
                setError(`Failed to fetch ${activeTab}: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        if (auth.token) { // Ensure user is authenticated
            fetchData();
        } else {
            setError("Authentication required to access admin panel.");
        }

    }, [activeTab, auth.token]); // Re-fetch when tab changes or token becomes available


    const handleAddClass = async (formData) => {
        setLoading(true);
        setFormError('');
        setSuccess('');
        try {
            // API Call: Add a new class
            const response = await api.addClass(formData, auth.token);
            setSuccess(response.message || 'Class added successfully!');
            // Refresh class list
            const updatedClasses = await api.getClasses();
            setClasses(updatedClasses);
        } catch (err) {
            setFormError(`Failed to add class: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDivision = async (formData) => {
        setLoading(true);
        setFormError('');
        setSuccess('');
        try {
            // API Call: Add a new division
            const response = await api.addDivision(formData, auth.token);
            setSuccess(response.message || 'Division added successfully!');
            // Refresh division list
            const updatedDivisions = await api.getDivisions();
            setDivisions(updatedDivisions);
        } catch (err) {
            setFormError(`Failed to add division: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCourse = async (formData) => {
        setLoading(true);
        setFormError('');
        setSuccess('');
        try {
            // API Call: Add a new course
            const response = await api.addCourse(formData, auth.token);
            setSuccess(response.message || 'Course added successfully!');
            // Refresh course list
            const updatedCourses = await api.getCourses();
            setCourses(updatedCourses);
        } catch (err) {
            setFormError(`Failed to add course: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Define form fields and table columns for each tab
    const tabConfig = {
        classes: {
            title: "Manage Classes",
            formFields: [
                {name: 'Class_ID', label: 'Class ID', placeholder: 'e.g., FYBCA'},
                {name: 'Year', label: 'Year', type: 'number', placeholder: 'e.g., 2024'},
                {name: 'No_Of_Students', label: 'Number of Students', type: 'number', placeholder: 'e.g., 60'},
            ],
            tableColumns: [
                {key: 'Class_ID', header: 'Class ID'},
                {key: 'Year', header: 'Year'},
                {key: 'No_Of_Students', header: 'Students'},
            ],
            data: classes,
            addFunction: handleAddClass,
        },
        divisions: {
            title: "Manage Divisions",
            formFields: [
                {name: 'Division_ID', label: 'Division ID', placeholder: 'e.g., FYBCA-A'},
                {name: 'Name', label: 'Division Name', placeholder: 'e.g., Division A'},
                // TODO: Replace Class_ID input with a dropdown populated from 'classes' state
                {name: 'Class_ID', label: 'Class ID (Must Exist)', placeholder: 'e.g., FYBCA'},
            ],
            tableColumns: [
                {key: 'Division_ID', header: 'Division ID'},
                {key: 'Name', header: 'Name'},
                {key: 'Class_ID', header: 'Class ID'},
                {key: 'Class_Year', header: 'Class Year'}, // From JOIN in backend
            ],
            data: divisions,
            addFunction: handleAddDivision,
        },
        courses: {
            title: "Manage Courses",
            formFields: [
                {name: 'Course_Code', label: 'Course Code', placeholder: 'e.g., CS101'},
                {name: 'Course_Name', label: 'Course Name', placeholder: 'e.g., Introduction to Programming'},
                // TODO: Replace Class_ID input with a dropdown populated from 'classes' state
                {name: 'Class_ID', label: 'Class ID (Must Exist)', placeholder: 'e.g., FYBCA'},
            ],
            tableColumns: [
                {key: 'Course_Code', header: 'Code'},
                {key: 'Course_Name', header: 'Name'},
                {key: 'Class_ID', header: 'Class ID'},
                {key: 'Class_Year', header: 'Class Year'}, // From JOIN in backend
            ],
            data: courses,
            addFunction: handleAddCourse,
        },
    };

    const currentConfig = tabConfig[activeTab];

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Admin Panel</h2>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {Object.keys(tabConfig).map((tabKey) => (
                        <button
                            key={tabKey}
                            onClick={() => setActiveTab(tabKey)}
                            className={`${
                                activeTab === tabKey
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            {tabConfig[tabKey].title}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Global Error/Success Messages */}
            {error && <p className="text-red-500 bg-red-100 p-3 rounded">{error}</p>}
            {success && <p className="text-green-500 bg-green-100 p-3 rounded">{success}</p>}


            {/* Content Area for Active Tab */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">{currentConfig.title}</h3>

                {/* Add New Item Form */}
                <h4 className="text-lg font-medium mb-2 text-gray-600">Add New {activeTab.slice(0, -1)}</h4>
                <FormComponent
                    fields={currentConfig.formFields}
                    onSubmit={currentConfig.addFunction}
                    submitText={`Add ${activeTab.slice(0, -1)}`}
                    loading={loading}
                    error={formError}
                />

                {/* Display Existing Items Table */}
                <h4 className="text-lg font-medium mb-2 mt-6 text-gray-600">Existing {activeTab}</h4>
                <TableComponent
                    columns={currentConfig.tableColumns}
                    data={currentConfig.data}
                    loading={loading && currentConfig.data.length === 0} // Show loading only if data isn't already loaded
                    error={!loading && error && currentConfig.data.length === 0 ? error : null} // Show error if loading failed and no data
                />
            </div>
        </div>
    );
}

export default AdminDashboard;
