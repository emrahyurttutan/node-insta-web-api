const axios = require("axios");

const axiosRequest = (url, options) => {
  return axios.request({
    url,
    ...options,
    data: options.body,
  });
};

const nodeFetchInstagram = {
  post: (uri, payload = {}, headers = {}) =>
    new Promise((resolve, reject) => {
      console.log({
        headers: headers,
        body: payload,
      }, "headers post request");
      axiosRequest(uri, {
        method: "POST",
        headers: headers,
        body: payload,
        withCredentials: false,
      })
        .then((res) => {
          // console.log(JSON.stringify(res), "resresres post");
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    }),
  postResJson: (uri, payload, headers = {}) =>
    new Promise((resolve, reject) => {
      axiosRequest(uri, {
        method: "POST",
        headers: headers,
        body: payload,
        withCredentials: false,
      })
        .then(async (res) => {
          resolve(await res.json());
        })
        .catch((err) => {
          reject(err);
        });
    }),
  get: (uri, headers = {}) =>
    new Promise((resolve, reject) => {
      axiosRequest(uri, {
        method: "GET",
        headers: headers,
        withCredentials: false,
      })
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    }),

  getCookie: (uri, headers = {}) =>
    new Promise((resolve, reject) => {
      console.log(headers, "headers request");
      axiosRequest(uri, {
        method: "GET",
        headers: headers,
        withCredentials: false,
      })
        .then((res) => {
          const data = {
            cookie: res.headers["set-cookie"],
            claim: res.headers["x-ig-set-www-claim"],
          };
          console.log(data, "getCookie  res.headers");
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    }),
  getText: (uri, headers = {}) =>
    new Promise((resolve, reject) => {
      axiosRequest(uri, {
        method: "GET",
        headers: { ...headers, "Content-Type": "text/plain" },
        withCredentials: false,
        responseType: "text",
      })
        .then(async (res) => {
          resolve(res.data);
        })
        .catch((err) => {
          reject(err);
        });
    }),
};

module.exports = { nodeFetchInstagram };
