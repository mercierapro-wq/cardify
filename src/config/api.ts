export const API_BASE_URL = 'https://407c49db4f2f.ngrok-free.app'

export const API_ENDPOINTS = {
  INSERT_CARD: `${API_BASE_URL}/webhook/InsertCard`,
  GET_CARDS: `${API_BASE_URL}/webhook/GetCards`,
  UPDATE_CARD: `${API_BASE_URL}/webhook/UpdateCard`,
  INSERT_MESSAGE: `${API_BASE_URL}/webhook/InsertMessage`,
  READ_MESSAGES: `${API_BASE_URL}/webhook/ReadMessages`,
  GET_USER: `${API_BASE_URL}/webhook/GetUser`, // Endpoint for user login
  INSERT_USER: `${API_BASE_URL}/webhook/InsertUser`, // New endpoint for user registration
  INSERT_ULINK_CARD: `${API_BASE_URL}/webhook/InsertUlinkCard`, // New endpoint for linking users to cards
  GET_CARDS_BY_USER: `${API_BASE_URL}/webhook/GetCardsByUser`, // New endpoint for reading cards linked to a user
  GET_USERS_BY_CARD: `${API_BASE_URL}/webhook/GetUsersByCard`, // New endpoint for reading users linked to a card
  UPDATE_ULINK_CARD: `${API_BASE_URL}/webhook/UpdateUlinkCard`, // New endpoint for updating user-card links
  DELETE_ULINK_CARD: `${API_BASE_URL}/webhook/DeleteUlinkCard`, // New endpoint for deleting user-card links
  CREATE_CONTENT: `${API_BASE_URL}/webhook/create_content`, // New endpoint for generating message content
  SEND_EMAIL: `${API_BASE_URL}/webhook/SendEmail`, // New endpoint for sending emails
}
