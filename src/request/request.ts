import axios from "axios";

const request = axios.create({
  baseURL: 'https://www.themoviedb.org',
});

export default request;