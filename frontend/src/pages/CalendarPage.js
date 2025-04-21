import React, { useState, useEffect } from 'react';

const API_BASE_CALENDAR = 'http://localhost:5000';
const API_BASE_INFRA = 'http://localhost:3001';
const API_BASE_LAB_MONITORING = 'http://localhost:3003';

const LabManager = () => {
  const [potentialLabs, setPotentialLabs] = useState([]);
  const [labsCreated, setLabsCreated] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventsYesterdayToTomorrow = async () => {
      setLoading(true);
      setError(null);

      // Get the start of yesterday in UTC
      const yesterdayStartUTC = new Date();
      yesterdayStartUTC.setUTCDate(yesterdayStartUTC.getUTCDate() - 1);
      yesterdayStartUTC.setUTCHours(0, 0, 0, 0);
      const startDateUTC = yesterdayStartUTC.toISOString();

      // Get the end of tomorrow in UTC
      const tomorrowEndUTC = new Date();
      tomorrowEndUTC.setUTCDate(tomorrowEndUTC.getUTCDate() + 1);
      tomorrowEndUTC.setUTCHours(23, 59, 59, 999);
      const endDateUTC = tomorrowEndUTC.toISOString();

      try {
        const response = await fetch(`${API_BASE_CALENDAR}/api/events/range?start=${startDateUTC}&end=${endDateUTC}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const events = await response.json();
        const labEvents = events;
        setPotentialLabs(labEvents);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching events from yesterday to tomorrow:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventsYesterdayToTomorrow();
  }, []);

  const handleCreateLab = async (event) => {
    setLoading(true);
    setError(null);
    const defaultLabConfig = {
      name: event.title || 'Default Lab Name',
      estimated_users: 1,
      estimated_cpu: 1,
      estimated_memory: 2,
      estimated_disk: 10,
    };

    try {
      // Check if a lab with the same name already exists
      const monitorResponse = await fetch(`${API_BASE_LAB_MONITORING}/monitor/labs`);
      if (!monitorResponse.ok) {
        throw new Error(`HTTP error! status: ${monitorResponse.status}`);
      }
      const existingLabs = await monitorResponse.json();
      const labExists = existingLabs.some(lab => lab.name === defaultLabConfig.name);

      if (labExists) {
        setPotentialLabs(prevLabs => prevLabs.filter(labEvent => labEvent._id !== event._id));
        alert(`A lab with the name "${defaultLabConfig.name}" already exists.`);
      } else {
        // Create a new lab if it doesn't exist
        const createResponse = await fetch(`${API_BASE_INFRA}/create-lab/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(defaultLabConfig),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.text();
          throw new Error(`HTTP error! status: ${createResponse.status}, message: ${errorData}`);
        }

        const newLab = await createResponse.json();
        setLabsCreated(prevLabs => [...prevLabs, newLab]);
        setPotentialLabs(prevLabs => prevLabs.filter(labEvent => labEvent._id !== event._id));
        alert(`Lab "${newLab.name}" created with ID: ${newLab.labId}`);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error creating/checking lab:', err);
      alert('Failed to create or check lab.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAllLabs = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch existing labs to check for duplicates
      const monitorResponse = await fetch(`${API_BASE_LAB_MONITORING}/monitor/labs`);
      if (!monitorResponse.ok) {
        throw new Error(`HTTP error! status: ${monitorResponse.status}`);
      }
      const existingLabs = await monitorResponse.json();
      const existingLabNames = existingLabs.map(lab => lab.name);

      // 2. Filter out potential labs that already exist
      const labsToCreate = potentialLabs.filter(event => {
        const labName = event.title || 'Default Lab Name';
        return !existingLabNames.includes(labName);
      });

      // 3. Create the new labs
      const creationPromises = labsToCreate.map(async (event) => {
        const defaultLabConfig = {
          name: event.title || 'Default Lab Name',
          estimated_users: 1,
          estimated_cpu: 1,
          estimated_memory: 2,
          estimated_disk: 10,
        };

        const createResponse = await fetch(`${API_BASE_INFRA}/create-lab/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(defaultLabConfig),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.text();
          console.error(`Error creating lab for event ${event.title}: ${createResponse.status} - ${errorData}`);
          return null; // Indicate failure for this specific lab
        }
        return await createResponse.json();
      });

      const newLabs = await Promise.all(creationPromises);
      const successfulLabs = newLabs.filter(lab => lab !== null);

      // 4. Update state and inform the user
      setLabsCreated(prevLabs => [...prevLabs, ...successfulLabs]);
      setPotentialLabs([]); // Clear all potential labs
      const numCreated = successfulLabs.length;
      const numSkipped = potentialLabs.length - numCreated;

      if (numCreated > 0) {
        alert(`${numCreated} lab(s) created successfully.`);
      }
      if (numSkipped > 0) {
        alert(`${numSkipped} lab(s) already existed and were not created.`);
      }
      if (numCreated === 0 && numSkipped === 0) {
        alert('No labs were created.'); // or "All labs already exist"
      }
    } catch (err) {
      setError(err.message);
      console.error('Error creating labs:', err);
      alert('Failed to create labs.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Potential Labs for Today</h1>
      {potentialLabs.length > 0 ? (
        <div>
          <p>The following events today have "lab" in their description. Click 'Create Lab' to provision a lab based on these events.</p>
          <ul>
            {potentialLabs.map(event => (
              <li key={event._id}>
                <strong>{event.title}</strong> - {event.desc}
                <button onClick={() => handleCreateLab(event)}>Create Lab</button>
              </li>
            ))}
          </ul>
          <button onClick={handleCreateAllLabs}>Create All Labs</button>
        </div>
      ) : (
        <p>No events with "lab" in the description found for today.</p>
      )}

      {labsCreated.length > 0 && (
        <div>
          <h2>Successfully Created Labs</h2>
          <ul>
            {labsCreated.map(lab => (
              <li key={lab.labId}>Lab ID: {lab.labId}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LabManager;