import axios from "axios";

const API_URL = "http://localhost:5000"; // Replace with your backend URL

export const synthesizeSpeech = async (text, emotion) => {
  try {
    const response = await axios.post(`${API_URL}/synthesize`, {
      text,
      emotion,
    });
    return response.data;
  } catch (error) {
    console.error("Error synthesizing speech:", error.response?.data || error.message);
    throw error;
  }
};

export const synthesizeMulti = async (segments) => {
  try {
    const response = await axios.post(`${API_URL}/synthesize-multi`, {
      segments,
    });
    return response.data;
  } catch (error) {
    console.error("Error synthesizing multi-segment speech:", error.response?.data || error.message);
    throw error;
  }
};

export const getEmotions = async () => {
  try {
    const response = await axios.get(`${API_URL}/emotions`);
    return response.data.emotions;
  } catch (error) {
    console.error("Error fetching emotions:", error.response?.data || error.message);
    throw error;
  }
};