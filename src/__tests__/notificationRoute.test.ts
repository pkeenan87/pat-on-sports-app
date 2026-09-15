import { routeFromNotificationData } from "../lib/notificationRoute";

describe("notification response route mapping", () => {
  it("routes to the article when slug is present", () => {
    expect(
      routeFromNotificationData({
        slug: "week-01-pros-cons",
        url: "https://patonsports.com/blog/week-01-pros-cons",
      })
    ).toEqual({ type: "article", slug: "week-01-pros-cons" });
  });

  it("falls back to opening data.url when slug is missing", () => {
    expect(
      routeFromNotificationData({
        url: "https://patonsports.com/blog/week-01-pros-cons",
      })
    ).toEqual({
      type: "url",
      url: "https://patonsports.com/blog/week-01-pros-cons",
    });
  });

  it("returns none when both slug and url are missing", () => {
    expect(routeFromNotificationData({})).toEqual({ type: "none" });
    expect(routeFromNotificationData(undefined)).toEqual({ type: "none" });
  });

  it("ignores blank slug and uses url", () => {
    expect(
      routeFromNotificationData({
        slug: "   ",
        url: "https://patonsports.com/blog/x",
      })
    ).toEqual({ type: "url", url: "https://patonsports.com/blog/x" });
  });
});
