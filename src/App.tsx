import { max, min } from "lodash";
import { useCallback, useEffect, useState } from "react";

const getYYYYMMDD = (date: Date) => date.toISOString().split("T")[0];
const latitude = 37.7818837;
const longitude = -122.4311703;

const DAY_START = 7;
const DAY_END = 23;

const BASELINE_VALUE = 60;
const BASELINE_Y = 180;

const SCALE_Y = 5;

function App() {
  const [yesterdayTemps, setYesterdayTemps] = useState<number[]>([]);
  const [todayTemps, setTodayTemps] = useState<number[]>([]);
  const [times, setTimes] = useState<Date[]>([]);
  const WIDTH = 480 / (DAY_END - DAY_START);
  const fetchData = useCallback(() => {
    (async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,apparent_temperature,precipitation,cloudcover&temperature_unit=fahrenheit&windspeed_unit=kn&precipitation_unit=inch&timeformat=unixtime&timezone=auto&start_date=${getYYYYMMDD(
          yesterday
        )}&end_date=${getYYYYMMDD(today)}`
      );
      const json = await res.json();
      const data = json.hourly;
      setYesterdayTemps(data.temperature_2m.slice(DAY_START, DAY_END));
      setTodayTemps(data.temperature_2m.slice(DAY_START + 23, DAY_END + 23));
      setTimes(
        data.time
          .slice(DAY_START, DAY_END)
          .map((t: number) => new Date(t * 1000))
      );
    })();
  }, []);
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);
  if (times.length === 0) {
    return <div>loading...</div>;
  }
  const maxIdx = todayTemps.indexOf(max(todayTemps) as number);
  const minIdx = todayTemps.indexOf(min(todayTemps) as number);
  const nowX =
    480 *
    ((new Date().valueOf() - times[0].valueOf()) /
      (times[times.length - 1].valueOf() - times[0].valueOf()));
  return (
    <div>
      <svg width="100%" height="100%" viewBox="0 0 480 272">
        <line
          x1={nowX}
          y1={0}
          x2={nowX}
          y2={272}
          stroke={`rgba(255,255,255,0.5)`}
        />
        {yesterdayTemps.map((temp, i) => {
          const diffFromBaseline = (temp - BASELINE_VALUE) * SCALE_Y;
          return (
            <rect
              key={i}
              x={i * WIDTH}
              y={BASELINE_Y - (diffFromBaseline > 0 ? diffFromBaseline : 0)}
              width={WIDTH}
              height={Math.abs(diffFromBaseline)}
              fill="#FFFFFF"
              fillOpacity={0.35}
            />
          );
        })}
        {todayTemps.map((temp, i) => {
          const diffFromBaseline = (temp - BASELINE_VALUE) * SCALE_Y;
          const warmer = yesterdayTemps[i] < temp;
          const y = BASELINE_Y - (diffFromBaseline > 0 ? diffFromBaseline : 0);
          return (
            <g>
              <text
                x={i * WIDTH + WIDTH / 4}
                y={BASELINE_Y + 50}
                fontFamily={"monospace"}
                fontSize={12}
                fill={warmer ? "#ff8080" : "#6969ff"}
              >
                {Math.round(temp)}
              </text>
              {i % 3 === 0 && (
                <text
                  x={i * WIDTH + WIDTH / 4}
                  y={BASELINE_Y + 70}
                  fontFamily={"monospace"}
                  fontSize={12}
                  fill={"#e4e4e4"}
                >
                  {times[i].getHours()}
                </text>
              )}
              {i === maxIdx && (
                <>
                  <text
                    x={i * WIDTH + 15}
                    y={45}
                    fontFamily={"monospace"}
                    fontSize={12}
                    fill={"#FFFFFF"}
                  >
                    high: {Math.round(temp)} ({warmer ? "+" : "-"}
                    {Math.round(Math.abs(temp - yesterdayTemps[i]))})
                  </text>
                  <line
                    x1={i * WIDTH + 40}
                    y1={50}
                    x2={i * WIDTH + WIDTH / 2}
                    y2={y}
                    stroke={"#FFFFFF"}
                  />
                </>
              )}
              {i === minIdx && (
                <>
                  <text
                    x={i * WIDTH + 15}
                    y={45}
                    fontFamily={"monospace"}
                    fontSize={12}
                    fill={"#FFFFFF"}
                  >
                    low: {Math.round(temp)} ({warmer ? "+" : "-"}
                    {Math.round(Math.abs(temp - yesterdayTemps[i]))})
                  </text>
                  <line
                    x1={i * WIDTH + 40}
                    y1={50}
                    x2={i * WIDTH + WIDTH / 2}
                    y2={y}
                    stroke={"#FFFFFF"}
                  />
                </>
              )}
              <rect
                key={i}
                x={i * WIDTH}
                y={y}
                width={WIDTH}
                height={Math.abs(diffFromBaseline)}
                fill={warmer ? "#ff8080" : "#6969ff"}
                fillOpacity={0.7}
              />
            </g>
          );
        })}
        <line
          x1="0"
          y1={BASELINE_Y}
          x2="480"
          y2={BASELINE_Y}
          stroke="#FFFFFF"
        />
      </svg>
    </div>
  );
}

export default App;
