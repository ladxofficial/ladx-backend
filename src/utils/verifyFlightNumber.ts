import axios from "axios";

// const verifyFlightNumber = async (flightNumber: string, travelDate: string): Promise<boolean> => {
//     try {
//         const apiKey = process.env.AVIATIONSTACK_API_KEY; 
//         const url = `http://api.aviationstack.com/v1/flights`;


//         const response = await axios.get(url, {
//             params: {
//                 access_key: apiKey,
//                 flight_iata: flightNumber,
//                 flight_date: travelDate, 
//             },
//         });

//         const flights = response.data.data;
//         if (!flights || flights.length === 0) {
//             console.error("Flight not found.");
//             return false;
//         }


//         const flight = flights[0];
//         console.log(`Verified Flight: ${flight.flight.iata} on ${flight.flight_date}`);
//         return true;
//     } catch (error) {

//         if (axios.isAxiosError(error)) {
//             console.error("Axios error verifying flight number:", error.response?.data || error.message);
//         } else if (error instanceof Error) {
//             console.error("General error verifying flight number:", error.message);
//         } else {
//             console.error("Unknown error verifying flight number:", error);
//         }
//         return false;
//     }
// };
const verifyFlightNumber = async (flightNumber: string, travelDate: string): Promise<boolean> => {
    // Mock implementation
    console.log(`Mock verifying flight: ${flightNumber} on ${travelDate}`);

    // You can adjust the condition here to simulate success or failure based on input
    if (flightNumber && travelDate) {
        console.log("Mock flight verification succeeded.");
        return true; // Mock success
    } else {
        console.error("Mock flight verification failed.");
        return false; // Mock failure
    }
};

export default verifyFlightNumber;
