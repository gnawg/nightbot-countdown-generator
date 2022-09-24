import "./App.css";
import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material/styles";
import {
  AppBar,
  Autocomplete,
  Box,
  Container,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
  ButtonGroup,
  Toolbar,
  Typography,
  Button,
} from "@mui/material";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import React, { useEffect, useState } from "react";
import { DateTime, SystemZone, Settings, Info } from "luxon";
import { Timezones } from "./constants";
import RestoreIcon from "@mui/icons-material/Restore";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const theme = createTheme({
  /*   palette: {
    primary: {
      main: purple[500],
    },
    secondary: {
      main: green[500],
    },
  }, */
});

const SYSZONE = new SystemZone().name;

const units = ["years", "months", "days", "hours", "minutes", "seconds"];

function singular(str) {
  return str.slice(0, -1);
}

function formatCountdown(dur) {
  if (!dur) return ``;
  const ago = Math.round(dur.valueOf() / 1000) < 0;

  let str = units.reduce((str, unit) => {
    if (!dur[unit]) return str;
    const qty = `${Math.abs(Math.round(dur[unit]))}`;
    const u = dur[unit] === 1 ? singular(unit) : unit;
    return str ? `${str} ${qty} ${u}` : `${qty} ${u}`;
  }, "");

  str = str ? str : "0 seconds";

  return `${str}${ago ? " ago" : ""}`;
}

export function useTime() {
  const tz = localStorage.timezone || SYSZONE;
  const [targetTimezone, setTargetTimezone] = useState(tz);
  const [targetTime, setTargetTime] = useState(DateTime.now().setZone(tz));

  useEffect(() => {
    setTargetTime(targetTime?.setZone(targetTimezone));
    localStorage.timezone = targetTimezone;
    Settings.defaultZone = targetTimezone;
  }, [targetTimezone, targetTime]);

  function handleSetTimezone(tz) {
    if (tz && Info.normalizeZone(tz).isValid) setTargetTimezone(tz);
  }

  return {
    targetTime,
    setTargetTime,
    targetTimezone,
    setTargetTimezone: handleSetTimezone,
  };
}

export function useCountdown(dt) {
  const [duration, setDuration] = useState(DateTime.now().diffNow(units));

  useEffect(() => {
    setDuration(dt?.diffNow(units)); //update immediately

    const intervalId = setInterval(() => setDuration(dt?.diffNow(units)), 1000); // also update once a second
    return () => clearInterval(intervalId);
  }, [dt]);

  return [duration, setDuration];
}

export function useText() {
  const [cmd, setCmd] = useState(localStorage.cmd || "!stream");
  const [pretext, setPretext] = useState(
    localStorage.pretext ||
      "Can't you read? You think I'm some kind of time servant that will tell you the next scheduled stream is in "
  );
  const [posttext, setPosttext] = useState(localStorage.posttext || "?");
  const [newCmd, setNewCmd] = useState(localStorage.newCmd === "true");

  useEffect(() => {
    localStorage.cmd = cmd;
  }, [cmd]);
  useEffect(() => {
    localStorage.pretext = pretext;
  }, [pretext]);
  useEffect(() => {
    localStorage.posttext = posttext;
  }, [posttext]);
  useEffect(() => {
    localStorage.newCmd = newCmd;
  }, [newCmd]);

  return {
    cmd,
    setCmd,
    pretext,
    setPretext,
    posttext,
    setPosttext,
    newCmd,
    setNewCmd,
  };
}

export function findNextWeekday(target /* : (1 | 2 | 3 | 4 | 5 | 6 | 7) */) {
  const now = DateTime.now();
  const currWeekday = now.weekday;
  const offset =
    currWeekday <= target ? target - currWeekday : target - currWeekday + 7;
  return now.plus({ day: offset });
}

function App() {
  const { targetTime, setTargetTime, targetTimezone, setTargetTimezone } =
    useTime();
  const {
    cmd,
    setCmd,
    pretext,
    setPretext,
    posttext,
    setPosttext,
    newCmd,
    setNewCmd,
  } = useText();
  const [duration] = useCountdown(targetTime);

  const weekdayIndices = [0, 1, 2, 3, 4, 5, 6].map(
    (num) => (DateTime.now().weekday + num - 1) % 7
  );

  const TIME_HOTKEYS = [
    { hour: 5 + 12, minute: "00", second: 0 },
    { hour: 5 + 12, minute: "30", second: 0 },
    { hour: 6 + 12, minute: "00", second: 0 },
    { hour: 6 + 12, minute: "30", second: 0 },
    { hour: 7 + 12, minute: "00", second: 0 },
    { hour: 7 + 12, minute: "30", second: 0 },
    { hour: 8 + 12, minute: "00", second: 0 },
    { hour: 8 + 12, minute: "30", second: 0 },
  ];

  const script =
    targetTime?.isValid && targetTimezone
      ? `$(countdown ${targetTime.toFormat(
          // $(countdown Dec 25 2015 12:00:00 AM EST)
          "MMM dd yyyy hh:mm:ss a"
        )} ${targetTimezone})`
      : "invalid time!!";

  const fullOutput = `!commands ${
    newCmd ? "add" : "edit"
  } ${cmd} ${pretext}${script}${posttext}
  }`;

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <AppBar position="static">
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Typography variant="h6" component="h1">
              Nightbot Countdown Tool
            </Typography>
            <title>Nightbot Countdown Tool</title>
          </Toolbar>
        </AppBar>
        <Container component="main" maxWidth="sm" sx={{ mt: 2 }}>
          <Grid container spacing={1}>
            {/* ----- */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                id="timezone-select"
                options={Timezones}
                defaultValue={targetTimezone}
                renderInput={(params) => {
                  return <TextField {...params} label="Timezone" />;
                }}
                value={targetTimezone}
                onChange={(e, val) => {
                  setTargetTimezone(val || SYSZONE);
                }}
                clearIcon={<RestoreIcon />}
                clearText="Reset to System"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DateTimePicker
                renderInput={(props) => <TextField fullWidth {...props} />}
                label="Date & Time"
                value={targetTime}
                disableMaskedInput
                onChange={(newValue) => {
                  setTargetTime(newValue);
                }}
                inputFormat="MM/dd/yy h:mm:ss a"
              />
            </Grid>
            <Grid item xs={12}>
              <ButtonGroup fullWidth>
                {weekdayIndices.map((i) => {
                  return (
                    <Button
                      key={i}
                      variant={
                        targetTime.weekday === i + 1 ? "contained" : "outlined"
                      }
                      onClick={() => {
                        const { year, month, day } = findNextWeekday(
                          i + 1
                        ).toObject();
                        setTargetTime(targetTime.set({ year, month, day }));
                      }}
                    >
                      {Info.weekdays("short")[i]}
                    </Button>
                  );
                })}
              </ButtonGroup>
              <ButtonGroup fullWidth>
                {TIME_HOTKEYS.map((obj) => {
                  const { hour: hr, minute: min } = DateTime.fromObject(obj);
                  return (
                    <Button
                      key={`${obj.hour}${obj.minute}`}
                      variant={
                        targetTime.hour === hr && targetTime.minute === min
                          ? "contained"
                          : "outlined"
                      }
                      onClick={() => {
                        setTargetTime(targetTime.set(obj));
                      }}
                    >
                      {DateTime.fromObject(obj).toFormat("h:mm")}
                    </Button>
                  );
                })}
              </ButtonGroup>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" component="h2">
                Config
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <TextField
                label="stream command"
                id="command"
                size="small"
                fullWidth
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Switch
                    disabled={!cmd}
                    checked={newCmd}
                    onChange={(e) => setNewCmd(e.target.checked)}
                  />
                }
                labelPlacement="start"
                label="addcom?"
              />
            </Grid>

            <Grid item xs={12}>
              <Box>
                <TextField
                  id="pretext"
                  label="Pre-countdown text"
                  fullWidth
                  multiline
                  variant="standard"
                  sx={{ border: 0 }}
                  value={pretext}
                  onChange={(e) => setPretext(e.target.value)}
                />

                <TextField
                  fullWidth
                  disabled
                  variant="standard"
                  id="script"
                  label="Countdown script"
                  value={script}
                />

                <TextField
                  id="posttext"
                  label="Post-countdown text"
                  fullWidth
                  multiline
                  variant="standard"
                  value={posttext}
                  onChange={(e) => setPosttext(e.target.value)}
                />
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" component="h2">
                Preview:
                <Button
                  onClick={() => navigator.clipboard.writeText(fullOutput)}
                >
                  <ContentCopyIcon />
                </Button>
              </Typography>
            </Grid>
            <Grid item xs={6} alignContent="right"></Grid>
            <Grid item xs={12}>
              <Typography>
                <strong>You:</strong> <em>{fullOutput}</em>
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                <strong>Hapless Viewer:</strong> {cmd}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                <strong>Nightbot: </strong>
                {`${pretext}${formatCountdown(duration)}${posttext}`}
              </Typography>
            </Grid>
          </Grid>
          <iframe
            id="twitch-chat-embed"
            src="https://www.twitch.tv/embed/etalyx/chat?parent=localhost&gnawg.github.io"
            height="500"
            width="350"
          ></iframe>
        </Container>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
