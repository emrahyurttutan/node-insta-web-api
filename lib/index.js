const { nodeFetchInstagram } = require("./request");
const helpers = require("./helpers/helper");
const useragentFromSeed = require("useragent-from-seed");

class Instagram {
  constructor(username, password) {
    this.credentials = {
      username,
      password,
    };
    this.baseUrl = "https://www.instagram.com/";
    this.baseUrlZ4 = "https://z-p4.www.instagram.com/";
    this.ig_did = "";
    this.csrf = "";
    this.rur = "";
    this.mid = "";
    this.username = "";
    this.phoneNumber = "";
    this.firstName = "";
    this.language = "";
    this.sessionid = "";
    this.ds_user_id = "";

    this.headers = {
      authority: "www.instagram.com",
      "content-type": "application/x-www-form-urlencoded",
      origin: "https://www.instagram.com",
      "accept-language": this.language || "tr-TR,id;q=0.9,tr-TR;q=0.8,tr;q=0.7",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      "x-ig-app-id": 936619743392459,
      "x-ig-www-claim": "hmac.AR3W0DThY2Mu5Fag4sW5u3RhaR3qhFD_5wvYbOJOD9qaPjIf",
      "x-instagram-ajax": 1,
      "x-requested-with": "XMLHttpRequest",
    };

    this.requestNodeFetch = nodeFetchInstagram;
  }

  async getCookie() {
    try {
      this.headers["user-agent"] = useragentFromSeed();
      const result = await this.requestNodeFetch.getCookie(
        "https://www.instagram.com/api/v1/web/data/shared_data/",
        this.headers
      );
      this.ig_did = result.cookie.find((x) => {
        return x.includes("ig_did");
      })
        ? result.cookie
            .find((x) => {
              return x.includes("ig_did");
            })
            .split(";")[0]
        : "";
      this.csrf = result.cookie.find((x) => {
        return x.includes("csrftoken");
      })
        ? result.cookie
            .find((x) => {
              return x.includes("csrftoken");
            })
            .split(";")[0]
        : "";
      this.rur = result.cookie.find((x) => {
        return x.includes("rur");
      })
        ? result.cookie
            .find((x) => {
              return x.includes("rur");
            })
            .split(";")[0]
        : "";
      this.mid = result.cookie.find((x) => {
        return x.includes("mid");
      })
        ? result.cookie
            .find((x) => {
              return x.includes("mid");
            })
            .split(";")[0]
        : "";
      this.headers["x-csrftoken"] = this.csrf.split("=")[1];
      this.headers["x-ig-www-claim"] = result.claim[0];
      this.headers.cookie = `ig_cb=1; ${this.ig_did}; ${this.csrf}; ${this.rur}; ${this.mid}`;
      return this.headers;
    } catch (e) {
      return e;
    }
  }

  async getHeaders() {
    try {
      return this.headers;
    } catch (e) {
      return e;
    }
  }

  async login(username, password) {
    try {
      await this.getCookie();
      username = username || this.credentials.username;
      password = password || this.credentials.password;
      this.headers.referer = this.baseUrl;
      const body = `username=${username}&enc_password=${helpers.createEncPassword(
        password
      )}&queryParams=%7B%7D&optIntoOneTap=false`;

      const result = await this.requestNodeFetch.post(
        `${this.baseUrl}api/v1/web/accounts/login/ajax/`,
        body,
        this.headers
      );

      if (!result.headers["set-cookie"]) {
        throw new Error("No cookie");
      }

      const cookies = result.headers["set-cookie"];
      console.log(cookies, "cookies");

      if (
        !cookies.find((x) => {
          return x?.includes("sessionid");
        })
      ) {
        throw new Error("Login Failed, Please Try Again Later.");
      }
      const resultJson = result.data;
      console.log(resultJson, "resultJson");
      // const resultJson = await result.json();
      this.ds_user_id = resultJson.userId;
      this.sessionid = cookies
        .find((x) => {
          return x.includes("sessionid");
        })
        .split(";")[0];

      this.csrf = cookies
        .find((x) => {
          return x.includes("csrftoken");
        })
        .split(";")[0];
      this.headers["x-csrftoken"] = this.csrf.split("=")[1];
      this.headers.cookie = `ig_cb=1; ${this.ig_did}; ${this.csrf}; ${this.rur}; ${this.mid}; ds_user_id=${this.ds_user_id}; ${this.sessionid}`;

      this.credentials = {
        username,
        password,
        cookies,
      };

      // this._sharedData = await this._getSharedData();
      // fs.writeFileSync('Cookies.json', JSON.stringify(this.headers))
      return resultJson;
    } catch (e) {
      console.log(e, "error");
      throw new Error(e);
    }
  }

  async getProfileData() {
    try {
      const result = await this._getSharedData(`${this.baseUrl}accounts/edit/`);
      return result?.entry_data?.SettingsPages?.[0]?.form_data;
    } catch (e) {
      throw new Error(e);
    }
  }

  async getIdContentFromShortCode(codePage) {
    try {
      const result = await this.requestNodeFetch.get(
        `${this.baseUrl}graphql/query/?query_hash=6ff3f5c474a240353993056428fb851e&variables=%7B%22shortcode%22%3A%22${codePage}%22%2C%22include_reel%22%3Atrue%2C%22include_logged_out%22%3Afalse%7D`
      );
      const jsonResult = await result.json();
      return jsonResult.data.shortcode_media.owner.id;
    } catch (e) {
      throw new Error(e);
    }
  }

  async getContentDataById(idContent) {
    try {
      const result = await this.requestNodeFetch.get(
        `${this.baseUrl}graphql/query/?query_hash=15bf78a4ad24e33cbd838fdb31353ac1&variables=%7B%22id%22%3A%22${idContent}%22%2C%22first%22%3A12%7D`
      );
      const jsonResult = await result.json();
      return jsonResult.data.user.edge_owner_to_timeline_media.edges;
    } catch (e) {
      throw new Error(e);
    }
  }

  async getUserPostById(userId) {
    try {
      const result = await this.requestNodeFetch.get(
        `${
          this.baseUrl
        }graphql/query/?query_hash=eddbde960fed6bde675388aac39a3657&variables=${encodeURI(
          `{"id":"${userId}","first":1}`
        )}`,
        this.headers
      );
      return (await result.json()).data.user.edge_owner_to_timeline_media.edges;
    } catch (e) {
      throw new Error(e);
    }
  }

  async getMediaFeedByHashtag(tag) {
    try {
      const result = await this.requestNodeFetch.get(
        `${this.baseUrl}explore/tags/${tag}/?__a=1`
      );
      return (await result.json()).graphql.hashtag;
    } catch (e) {
      throw new Error(e);
    }
  }

  async getVideoByShortCode(codePage) {
    try {
      const idContent = await this.getIdContentFromShortCode(codePage);
      const dataContent = await this.getContentDataById(idContent);
      const videoUrl = dataContent.find((x) => {
        return x.node.shortcode == codePage;
      });
      const getVideo = await this.requestNodeFetch.get(videoUrl.node.video_url);
      const videoBuffer = await getVideo.buffer();
      const buf = Buffer.from(videoBuffer);
      const base64Video = buf.toString("base64");
      const data = {
        base64: base64Video,
        buffer: videoBuffer,
      };
      return data;
    } catch (e) {
      throw new Error(e);
    }
  }

  async updateProfile({ biography = "", email = "" }) {
    try {
      const oldData = await this.getProfileData();
      this.headers.referer = `${this.baseUrl}accounts/edit/`;
      const payload = `first_name=${oldData.first_name}&email=${
        email ? email : oldData.email
      }&username=${oldData.username}&phone_number=${
        oldData.phone_number
      }&biography=${
        biography || oldData.biography
      }&external_url=&chaining_enabled=on`;
      const result = await this.requestNodeFetch.post(
        `${this.baseUrl}accounts/edit/`,
        payload,
        this.headers
      );
      return await result.json();
    } catch (e) {
      throw new Error(e);
    }
  }

  async sendConfirmationEmail() {
    try {
      this.headers.referer = `${this.baseUrl}`;
      const result = await this.requestNodeFetch.post(
        `${this.baseUrlZ4}accounts/send_confirm_email/`,
        "",
        this.headers
      );
      return await result.json();
    } catch (e) {
      throw new Error(e);
    }
  }

  async registerLastAttemp(phoneNumber, username, password, firstName) {
    try {
      this.username = username;
      this.firstName = firstName;
      this.phoneNumber = phoneNumber;
      this.password = password;
      const dataString = `enc_password=${helpers.createEncPassword(
        password
      )}&phone_number=${phoneNumber}&username=${username}&first_name=${firstName}&month=4&day=6&year=2000&client_id=XrgMsAAEAAFhEED7k1NgmN3ULAB_&seamless_login_enabled=1`;
      this.headers.referer = `${this.baseUrl}accounts/emailsignup/`;
      this.headers["x-csrftoken"] = this.csrf.split("=")[1];
      const register = await this.requestNodeFetch.postResJson(
        `${this.baseUrl}accounts/web_create_ajax/attempt/`,
        dataString,
        this.headers
      );
      return register;
    } catch (e) {
      throw new Error(e);
    }
  }

  async registerSendOtp(phoneNumber) {
    try {
      const dataString = `client_id=XrgMsAAEAAFhEED7k1NgmN3ULAB_&phone_number=${phoneNumber}&phone_id=&big_blue_token=`;
      this.headers.referer = `${this.baseUrl}accounts/emailsignup/`;
      this.headers["x-csrftoken"] = this.csrf.split("=")[1];
      const register = await this.requestNodeFetch.postResJson(
        `${this.baseUrl}accounts/send_signup_sms_code_ajax/`,
        dataString,
        this.headers
      );
      return register;
    } catch (e) {
      throw new Error(e);
    }
  }

  async registerLastProcess(otpCode) {
    try {
      const dataString = `enc_password=${helpers.createEncPassword(
        this.password
      )}&phone_number=${this.phoneNumber}&username=${
        this.username
      }&first_name=${
        this.firstName
      }&month=4&day=6&year=2000&sms_code=${otpCode}&client_id=XrgMsAAEAAFhEED7k1NgmN3ULAB_&seamless_login_enabled=1&tos_version=row`;
      this.headers.referer = `${this.baseUrl}accounts/emailsignup/`;
      this.headers["x-csrftoken"] = this.csrf.split("=")[1];
      const register = await this.requestNodeFetch.postResJson(
        `${this.baseUrl}accounts/web_create_ajax/`,
        dataString,
        this.headers
      );
      return register;
    } catch (e) {
      throw new Error(e);
    }
  }

  async _getSharedData(url = this.baseUrl) {
    try {
      const getText = await this.requestNodeFetch.getText(url, this.headers);
      // fs.writeFileSync("data.html", getText);

      const dataParse = getText.split('["XIGSharedData",[],{"raw":');
      const data = dataParse[1].split(',"native":');

      // fs.writeFileSync("data.json", JSON.parse(data[0]));
      // const resultJsonStringData = `${_sharedData[1]}}`;
      const resultJson = JSON.parse(data[0]);
      return resultJson;
    } catch (e) {
      throw new Error(e);
    }
  }

  async _getMediaId(url = this.baseUrl) {
    try {
      const getText = await this.requestNodeFetch.getText(url, this.headers);
      const _getMediaId = getText
        .split('<meta property="al:ios:url" content="instagram://media?id=')
        .pop()
        .split('" />')[0];
      return _getMediaId;
    } catch (e) {
      throw new Error(e);
    }
  }

  async getImageByUser(username) {
    try {
      const result = await this._getSharedData(`${this.baseUrl}${username}/`);
      return result;
    } catch (e) {
      throw new Error(e);
    }
  }

  async getLoginActivity() {
    try {
      const result = await this._getSharedData(
        `${this.baseUrl}session/login_activity/`
      );
      return result.entry_data.SettingsPages[0].data;
    } catch (e) {
      throw new Error(e);
    }
  }

  async getRecentNotification() {
    try {
      const result = await this.requestNodeFetch.get(
        `${this.baseUrl}accounts/activity/?__a=1&include_reel=true`,
        this.headers
      );
      const resultJson = await result.json();
      return resultJson.graphql.user.activity_feed.edge_web_activity_feed.edges;
    } catch (e) {
      throw new Error(e);
    }
  }

  async getDirectMessage(limit = 10, thread_message_limit = 10) {
    try {
      const result = await this.requestNodeFetch.get(
        `${this.baseUrl}direct_v2/web/inbox/?persistentBadging=true&folder=&limit=${limit}&thread_message_limit=${thread_message_limit}`,
        this.headers
      );
      const resultJson = await result.json();
      return resultJson.inbox.threads;
    } catch (e) {
      throw new Error(e);
    }
  }

  async _getSchemaProfileData(username) {
    try {
      const getText = await this.requestNodeFetch.getText(
        `${this.baseUrl}${username}/`,
        this.headers
      );
      const _schemaData = getText
        .split('<script type="application/ld+json">')
        .pop()
        .split("</script>")[0];
      const resultJsonStringData = _schemaData.trim();
      const resultJson = JSON.parse(resultJsonStringData);
      return resultJson;
    } catch (e) {
      throw new Error(e);
    }
  }

  async getProfileByUsername(username) {
    try {
      const result = await this._getSharedData(
        `${this.baseUrl}${username}/`,
        this.headers
      );
      const schemaUserData = result.entry_data.ProfilePage[0].graphql.user;
      const data = {
        userId: schemaUserData.id,
        profilePicUrl: schemaUserData.profile_pic_url,
        name: schemaUserData.full_name,
        username: schemaUserData.username,
        biography: schemaUserData.biography,
        website: schemaUserData.external_url,
        follow: schemaUserData.edge_follow.count,
        followers: schemaUserData.edge_followed_by.count,
        totalPost: schemaUserData.edge_owner_to_timeline_media.count,
        followedByViewer: schemaUserData.followed_by_viewer,
        follows_viewer: schemaUserData.follows_viewer,
      };

      return data;
    } catch (e) {
      throw new Error(e);
    }
  }

  async followByUsername(username) {
    try {
      const { userId } = await this.getProfileByUsername(username);
      this.headers.referer = `${this.baseUrl}${username}/`;
      const result = await this.requestNodeFetch.post(
        `${this.baseUrl}web/friendships/${userId}/follow/`,
        null,
        this.headers
      );
      const resultJson = await result.json();
      return resultJson;
    } catch (e) {
      throw new Error(e);
    }
  }

  async unfollowByUsername(username) {
    try {
      const { userId } = await this.getProfileByUsername(username);
      this.headers.referer = `${this.baseUrl}${username}/`;
      const result = await this.requestNodeFetch.post(
        `${this.baseUrl}web/friendships/${userId}/unfollow/`,
        null,
        this.headers
      );
      const resultJson = await result.json();
      return resultJson;
    } catch (e) {
      throw new Error(e);
    }
  }

  async getStoriesByUsername(username) {
    try {
      const { userId } = await this.getProfileByUsername(username);
      this.headers.referer = `${this.baseUrl}${username}/`;
      const payloadVariables = {
        reel_ids: [userId],
        tag_names: [],
        location_ids: [],
        highlight_reel_ids: [],
        precomposed_overlay: false,
        show_story_viewer_list: true,
        story_viewer_fetch_count: 50,
        story_viewer_cursor: "",
        stories_video_dash_manifest: false,
      };
      const result = await this.requestNodeFetch.get(
        `${
          this.baseUrl
        }graphql/query/?query_hash=90709b530ea0969f002c86a89b4f2b8d&variables=${encodeURI(
          JSON.stringify(payloadVariables)
        )}`,
        this.headers
      );
      const resultJson = await result.json();
      const data = resultJson.data.reels_media[0];
      const newResult = {
        user: data.user,
        items: data.items.map((data) => {
          let story = {
            storyId: data.id,
            postAt: data.taken_at_timestamp,
            expiredAt: data.expiring_at_timestamp,
            storyUrl: data.story_cta_url,
            storiesImagePreview: data.display_url,
            isVideo: data.is_video,
            video: null,
          };
          if (data.is_video) {
            story.video = {
              duration: data.video_duration,
              source: data.video_resources,
            };
            return story;
          } else {
            return story;
          }
        }),
      };
      return newResult;
    } catch (e) {
      throw new Error(e);
    }
  }

  async likeMediaById(mediaId) {
    try {
      this.headers.referer = `${this.baseUrl}`;
      const result = await this.requestNodeFetch.post(
        `${this.baseUrl}web/likes/${mediaId}/like/`,
        null,
        this.headers
      );
      return await result.json();
    } catch (e) {
      throw new Error(e);
    }
  }

  async likeMediaByShortCode(shortCode) {
    try {
      this.headers.referer = `${this.baseUrl}p/${shortCode}/`;
      const mediaId = await this._getMediaId(`${this.baseUrl}p/${shortCode}/`);
      const result = await this.requestNodeFetch.post(
        `${this.baseUrl}web/likes/${mediaId}/like/`,
        null,
        this.headers
      );
      const resultJson = await result.json();
      return resultJson;
    } catch (e) {
      throw new Error(e);
    }
  }

  async unlikeMediaByShortCode(shortCode) {
    try {
      this.headers.referer = `${this.baseUrl}p/${shortCode}/`;
      const mediaId = await this._getMediaId(`${this.baseUrl}p/${shortCode}/`);
      const result = await this.requestNodeFetch.post(
        `${this.baseUrl}web/likes/${mediaId}/unlike/`,
        null,
        this.headers
      );
      const resultJson = await result.json();
      return resultJson;
    } catch (e) {
      throw new Error(e);
    }
  }

  async deleteMediaByShortCode(shortCode) {
    try {
      this.headers.referer = `${this.baseUrl}p/${shortCode}/`;
      const mediaId = await this._getMediaId(`${this.baseUrl}p/${shortCode}/`);
      const result = await this.requestNodeFetch.post(
        `${this.baseUrl}create/${mediaId}/delete/`,
        null,
        this.headers
      );
      const resultJson = await result.json();
      return resultJson;
    } catch (e) {
      throw new Error(e);
    }
  }

  async saveImageByShortCode(shortCode) {
    try {
      this.headers.referer = `${this.baseUrl}p/${shortCode}/`;
      const mediaId = await this._getMediaId(`${this.baseUrl}p/${shortCode}/`);
      const result = await this.requestNodeFetch.post(
        `${this.baseUrl}web/save/${mediaId}/save/`,
        null,
        this.headers
      );
      const resultJson = await result.json();
      return resultJson;
    } catch (e) {
      throw new Error(e);
    }
  }

  async unsaveImageByShortCode(shortCode) {
    try {
      this.headers.referer = `${this.baseUrl}p/${shortCode}/`;
      const mediaId = await this._getMediaId(`${this.baseUrl}p/${shortCode}/`);
      const result = await this.requestNodeFetch.post(
        `${this.baseUrl}web/save/${mediaId}/unsave/`,
        null,
        this.headers
      );
      const resultJson = await result.json();
      return resultJson;
    } catch (e) {
      throw new Error(e);
    }
  }

  async commentToMediaByMediaId({ mediaId = "", commentText = "" }) {
    try {
      this.headers.referer = `${this.baseUrl}p/${mediaId}/`;
      const payload = `comment_text=${commentText}&replied_to_comment_id=`;
      const result = await this.requestNodeFetch.post(
        `${this.baseUrl}web/comments/${mediaId}/add/`,
        payload,
        this.headers
      );
      return await result.json();
    } catch (e) {
      throw new Error(e);
    }
  }

  async commentToMediaByShortCode({ shortCode = "", commentText = "" }) {
    try {
      this.headers.referer = `${this.baseUrl}p/${shortCode}/`;
      const mediaId = await this._getMediaId(`${this.baseUrl}p/${shortCode}/`);
      const payload = `comment_text=${commentText}&replied_to_comment_id=`;
      const result = await this.requestNodeFetch.post(
        `${this.baseUrl}web/comments/${mediaId}/add/`,
        payload,
        this.headers
      );
      const resultJson = await result.json();
      return resultJson;
    } catch (e) {
      throw new Error(e);
    }
  }

  async replyCommentByShortCode({
    shortCode = "",
    commentText = "",
    commentId = "",
  }) {
    try {
      this.headers.referer = `${this.baseUrl}p/${shortCode}/`;
      const mediaId = await this._getMediaId(`${this.baseUrl}p/${shortCode}/`);
      const payload = `comment_text=${commentText}&replied_to_comment_id=${commentId}`;
      const result = await this.requestNodeFetch.post(
        `${this.baseUrl}web/comments/${mediaId}/add/`,
        payload,
        this.headers
      );
      const resultJson = await result.json();
      return resultJson;
    } catch (e) {
      throw new Error(e);
    }
  }

  async getEmbedMediaByShortCode(shortCode) {
    try {
      this.headers.referer = `${this.baseUrl}p/${shortCode}/`;
      const result = await this.requestNodeFetch.get(
        `https://api.instagram.com/oembed/?url=https://www.instagram.com/p/${shortCode}/&hidecaption=0&maxwidth=540`,
        this.headers
      );
      const resultJson = await result.json();
      return resultJson;
    } catch (e) {
      throw new Error(e);
    }
  }

  async findPeopleByUsername(username) {
    try {
      this.headers.referer = `${this.baseUrl}explore/search/`;
      const result = await this.requestNodeFetch.get(
        `${this.baseUrl}web/search/topsearch/?context=blended&query=%40${username}&rank_token=0.7932692446666738&include_reel=true
            `,
        this.headers
      );
      const resultJson = await result.json();
      return resultJson.users;
    } catch (e) {
      throw new Error(e);
    }
  }

  async findPeopleByUserId(userId) {
    try {
      this.headers.referer = `${this.baseUrl}explore/search/`;
      const result = await this.requestNodeFetch.get(
        `https://i.instagram.com/api/v1/users/${userId}/info/`,
        this.headers
      );
      return (await result.json()).user;
    } catch (e) {
      throw new Error(e);
    }
  }

  async getFollowingByDataUser(dataUser, first = 12, after = "") {
    try {
      const { userId, username } = dataUser;
      const hash = "d04b0a864b4b54837c0d870b0e77e076";
      const variable = {
        id: userId,
        include_reel: true,
        fetch_mutual: false,
        first: first,
        after: after,
      };
      this.headers.referer = `${this.baseUrl}${username}/following/`;
      const result = await this.requestNodeFetch.get(
        `${
          this.baseUrlZ4
        }graphql/query/?query_hash=${hash}&variables=${encodeURI(
          JSON.stringify(variable)
        )}`,
        this.headers
      );
      const resultJson = await result.json();
      return resultJson.data.user.edge_follow;
    } catch (e) {
      throw new Error(e);
    }
  }

  async getFollowersByDataUser(dataUser, first = 12, after = "") {
    try {
      const { userId, username } = dataUser;
      const hash = "c76146de99bb02f6415203be841dd25a";
      const variable = {
        id: userId,
        include_reel: true,
        fetch_mutual: false,
        first: first,
        after: after,
      };
      this.headers.referer = `${this.baseUrl}${username}/followers/`;
      const result = await this.requestNodeFetch.get(
        `${
          this.baseUrlZ4
        }graphql/query/?query_hash=${hash}&variables=${encodeURI(
          JSON.stringify(variable)
        )}`,
        this.headers
      );
      const resultJson = await result.json();
      return resultJson.data.user.edge_followed_by;
    } catch (e) {
      throw new Error(e);
    }
  }
}

module.exports = Instagram;
