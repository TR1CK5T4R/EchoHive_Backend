import axios from "axios";
(async () => {
  try {
    const res = await axios.post("http://localhost:5050/api/opt-in", {
      eventId: "something",
      email: "test@example.com",
      consent: true
    });
    console.log(res.data);
  } catch (e) {
    if (e.response) {
      console.log(e.response.status, e.response.data);
    } else {
      console.log(e);
    }
  }
})();
