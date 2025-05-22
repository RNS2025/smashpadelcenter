const {
  testCheckAndNotify,
  getPlayerId,
  getParticipatedEvents,
  getPlayerMatches,
} = require("../Schedules/TournamentNotificationSchedule");
const moment = require("moment");
const logger = require("../config/logger");
const { sendNotification } = require("../Services/subscriptionService");

// Mock dependencies
jest.mock("axios");
jest.mock("../services/subscriptionService", () => ({
  sendNotification: jest.fn(),
}));
jest.mock("../config/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));
const axios = require("axios");

describe("Tournament and Match Notification Scheduler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should send notification for an upcoming tournament", async () => {
    const user = {
      userId: "user123",
      rankedInId: "R000213008",
    };

    const mockPlayerResponse = {
      PlayerId: 1035666,
    };

    const tomorrow = moment().add(1, "day").toISOString();
    const mockEventsResponse = {
      Events: [
        {
          Id: "tournament1",
          Title: "Test Tournament",
          Type: "Tournament",
          StartDate: tomorrow,
        },
        {
          Id: "event1",
          Title: "Non-Tournament Event",
          Type: "Match",
          StartDate: tomorrow,
        },
      ],
    };

    const mockMatchesResponse = { Payload: [] };

    axios.get
      .mockResolvedValueOnce({ data: { Header: mockPlayerResponse } }) // playerprofileinfoasync
      .mockResolvedValueOnce({ data: mockEventsResponse }) // ParticipatedEventsAsync
      .mockResolvedValueOnce({ data: mockMatchesResponse }); // GetPlayerMatchesAsync

    const result = await testCheckAndNotify(user, {
      mockPlayerResponse,
      mockEventsResponse,
      mockMatchesResponse,
      testDate: moment(),
    });

    expect(result.success).toBe(true);
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0]).toMatchObject({
      userId: "user123",
      tournamentId: "tournament1",
      title: `Tournament Reminder: Test Tournament`,
      category: "turneringer",
    });
    expect(sendNotification).toHaveBeenCalledTimes(1);
    expect(sendNotification).toHaveBeenCalledWith(
      "user123",
      `Tournament Reminder: Test Tournament`,
      expect.any(String),
      "turneringer"
    );
    expect(logger.info).toHaveBeenCalledWith(
      "Tournament notification sent",
      expect.any(Object)
    );
  });

  it("should send notification for an upcoming match", async () => {
    const user = {
      userId: "user123",
      rankedInId: "R000213008",
    };

    const mockPlayerResponse = {
      PlayerId: 1035666,
    };

    const mockEventsResponse = { Events: [] };

    const in45Minutes = moment()
      .add(45, "minutes")
      .format("MM/DD/YYYY HH:mm:ss");
    const mockMatchesResponse = {
      Payload: [
        {
          MatchId: 1,
          Info: {
            EventName: "Test Match",
            Date: in45Minutes,
            Location: "Test Court",
          },
        },
      ],
    };

    axios.get
      .mockResolvedValueOnce({ data: { Header: mockPlayerResponse } })
      .mockResolvedValueOnce({ data: mockEventsResponse })
      .mockResolvedValueOnce({ data: mockMatchesResponse });

    const result = await testCheckAndNotify(user, {
      mockPlayerResponse,
      mockEventsResponse,
      mockMatchesResponse,
      testDate: moment(),
    });

    expect(result.success).toBe(true);
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0]).toMatchObject({
      userId: "user123",
      matchId: 1,
      title: `Match Reminder: Test Match`,
      category: "matches",
    });
    expect(sendNotification).toHaveBeenCalledTimes(1);
    expect(sendNotification).toHaveBeenCalledWith(
      "user123",
      `Match Reminder: Test Match`,
      expect.any(String),
      "matches"
    );
    expect(logger.info).toHaveBeenCalledWith(
      "Match notification sent",
      expect.any(Object)
    );
  });

  it("should handle missing rankedInId", async () => {
    const user = {
      userId: "user123",
    };

    const result = await testCheckAndNotify(user);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Missing rankedInId or userId");
    expect(logger.warn).toHaveBeenCalledWith(
      "Missing rankedInId or userId for user",
      expect.any(Object)
    );
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("should handle no upcoming tournaments or matches", async () => {
    const user = {
      userId: "user123",
      rankedInId: "R000213008",
    };

    const mockPlayerResponse = {
      PlayerId: 1035666,
    };

    const mockEventsResponse = {
      Events: [
        {
          Id: "event1",
          Title: "Past Tournament",
          Type: "Tournament",
          StartDate: moment().subtract(1, "day").toISOString(),
        },
      ],
    };

    const mockMatchesResponse = {
      Payload: [
        {
          MatchId: 1,
          Info: {
            EventName: "Past Match",
            Date: moment().subtract(1, "hour").format("MM/DD/YYYY HH:mm:ss"),
          },
        },
      ],
    };

    axios.get
      .mockResolvedValueOnce({ data: { Header: mockPlayerResponse } })
      .mockResolvedValueOnce({ data: mockEventsResponse })
      .mockResolvedValueOnce({ data: mockMatchesResponse });

    const result = await testCheckAndNotify(user, {
      mockPlayerResponse,
      mockEventsResponse,
      mockMatchesResponse,
      testDate: moment(),
    });

    expect(result.success).toBe(true);
    expect(result.notifications).toHaveLength(0);
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("should use testDate for date comparison", async () => {
    const user = {
      userId: "user123",
      rankedInId: "R000213008",
    };

    const testDate = moment("2025-06-01");
    const tournamentDate = moment("2025-06-02").toISOString();
    const matchDate = moment("2025-06-01 12:45:00").format(
      "MM/DD/YYYY HH:mm:ss"
    );
    const mockPlayerResponse = {
      PlayerId: 1035666,
    };
    const mockEventsResponse = {
      Events: [
        {
          Id: "tournament1",
          Title: "Test Tournament",
          Type: "Tournament",
          StartDate: tournamentDate,
        },
      ],
    };
    const mockMatchesResponse = {
      Payload: [
        {
          MatchId: 1,
          Info: {
            EventName: "Test Match",
            Date: matchDate,
          },
        },
      ],
    };

    axios.get
      .mockResolvedValueOnce({ data: { Header: mockPlayerResponse } })
      .mockResolvedValueOnce({ data: mockEventsResponse })
      .mockResolvedValueOnce({ data: mockMatchesResponse });

    const result = await testCheckAndNotify(user, {
      mockPlayerResponse,
      mockEventsResponse,
      mockMatchesResponse,
      testDate: moment("2025-06-01 12:15:00"), // 30 minutes before match
    });

    expect(result.success).toBe(true);
    expect(result.notifications).toHaveLength(2); // One for tournament, one for match
    expect(result.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: "user123",
          tournamentId: "tournament1",
          title: `Tournament Reminder: Test Tournament`,
          category: "turneringer",
        }),
        expect.objectContaining({
          userId: "user123",
          matchId: 1,
          title: `Match Reminder: Test Match`,
          category: "matches",
        }),
      ])
    );
    expect(sendNotification).toHaveBeenCalledTimes(2);
  });
});
