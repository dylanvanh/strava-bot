import express from "express";
import { env } from "../src/config/env.js";
import StravaClient, {
  StravaActivitySummary,
} from "../src/lib/strava-client.js";

export const app = express();
const stravaClient = new StravaClient();

const VIRTUAL_RIDE_ACTIVITY_TYPE = "VirtualRide" as const;
const BIKE_RIDE_ACTIVITY_TYPE = "Ride" as const;

interface ActivityMatch {
  indoorActivity: {
    id: number;
    name: string;
    start_date: string;
  };
  virtualRide: {
    id: number;
    name: string;
    start_date: string;
  };
}

interface CleanupResult {
  hidden: number[];
  matches: ActivityMatch[];
}

function isIndoorBikeActivity(activity: StravaActivitySummary): boolean {
  const isRideType = activity.type === BIKE_RIDE_ACTIVITY_TYPE;
  const isZeroDistance = activity.distance === 0;

  return isRideType && isZeroDistance;
}

function areActivitiesWithinOneHour(
  firstActivity: StravaActivitySummary,
  secondActivity: StravaActivitySummary,
): boolean {
  const firstActivityStartTime = new Date(firstActivity.start_date);
  const secondActivityStartTime = new Date(secondActivity.start_date);
  const timeDifferenceInMilliseconds = Math.abs(
    firstActivityStartTime.getTime() - secondActivityStartTime.getTime(),
  );
  const oneHourInMilliseconds = 60 * 60 * 1000;

  return timeDifferenceInMilliseconds <= oneHourInMilliseconds;
}

async function hideDuplicateIndoorRides(): Promise<CleanupResult> {
  const allActivities: StravaActivitySummary[] =
    await stravaClient.getAllActivities();

  const publicIndoorBikeActivities = allActivities.filter(
    (activity) => isIndoorBikeActivity(activity) && !activity.private,
  );

  const allVirtualRideActivities = allActivities.filter(
    (activity) => activity.type === VIRTUAL_RIDE_ACTIVITY_TYPE,
  );

  const hiddenActivityIds: number[] = [];
  const matchedActivityPairs: ActivityMatch[] = [];

  for (const indoorBikeActivity of publicIndoorBikeActivities) {
    const correspondingVirtualRide = allVirtualRideActivities.find(
      (virtualRideActivity) =>
        areActivitiesWithinOneHour(indoorBikeActivity, virtualRideActivity),
    );

    if (correspondingVirtualRide) {
      matchedActivityPairs.push({
        indoorActivity: {
          id: indoorBikeActivity.id,
          name: indoorBikeActivity.name,
          start_date: indoorBikeActivity.start_date,
        },
        virtualRide: {
          id: correspondingVirtualRide.id,
          name: correspondingVirtualRide.name,
          start_date: correspondingVirtualRide.start_date,
        },
      });

      await stravaClient.updateActivity(indoorBikeActivity.id, {
        hide_from_home: true,
      });

      hiddenActivityIds.push(indoorBikeActivity.id);
    }
  }

  return { hidden: hiddenActivityIds, matches: matchedActivityPairs };
}

app.get("/", async (req, res) => {
  try {
    const result = await hideDuplicateIndoorRides();
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default app;
