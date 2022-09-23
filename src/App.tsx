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
  Toolbar,
  Typography,
} from "@mui/material";
import { green, purple } from "@mui/material/colors";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import React, { useEffect, useState } from "react";
import {
  DateTime,
  Zone,
  SystemZone,
  Duration,
  Settings,
  Interval,
  Info
} from "luxon";
import { Timezones } from "./constants";
import RestoreIcon from "@mui/icons-material/Restore";

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
  const ago = Math.round(dur.valueOf() / 1000) < 0;

  let str = units.reduce((str, unit) => {
    if (!dur[unit]) return str;
    const qty = `${Math.abs(Math.round(dur[unit]))}`;
    const u = dur[unit] === 1 ? singular(unit) : unit;
    return `${str} ${qty} ${u}`;
  }, "");

  str = str ? str : "0 seconds";

  return `${str}${ago ? " ago" : ""}`;
}

export function useTime(time = DateTime.now(), tz = localStorage.timezone || SYSZONE) {
  const [targetTime, setTargetTime] = useState(time);
  const [targetTimezone, setTargetTimezone] = useState(tz);

  useEffect(() => {
    setTargetTime(targetTime.setZone(targetTimezone));
    localStorage.timezone = targetTimezone;
    Settings.defaultZone = targetTimezone;
  }, [targetTime, targetTimezone]);

  function handleSetTime(time){
    if(time.isValid) setTargetTime(time)
  }
  function handleSetTimezone(tz){
    if(Info.normalizeZone(tz).isValid) setTargetTimezone(tz)
  }

  return { targetTime, setTargetTime: handleSetTime, targetTimezone, setTargetTimezone: handleSetTimezone };
}

export function useCountdown(dt) {
  const [duration, setDuration] = useState(DateTime.now().diffNow(units));

  useEffect(() => {
    setDuration(dt.diffNow(units)); //update immediately

    const intervalId = setInterval(() => setDuration(dt.diffNow(units)), 1000); // also update once a second
    return () => clearInterval(intervalId);
  }, [dt]);

  return [duration, setDuration];
}

export function useText() {
  const [cmd, setCmd] = useState(localStorage.cmd || "");
  const [pretext, setPretext] = useState(localStorage.pretext || "");
  const [posttext, setPosttext] = useState(localStorage.posttext || "");
  const [newCmd, setNewCmd] = useState(localStorage.newCmd==='true')

  useEffect(()=>{
    localStorage.cmd = cmd
  }, [cmd])
  useEffect(()=>{
    localStorage.pretext = pretext
  }, [pretext])
  useEffect(()=>{
    localStorage.posttext = posttext
  }, [posttext])
  useEffect(()=>{
    console.log(localStorage)
    localStorage.newCmd = newCmd
  }, [newCmd])

  return {cmd, setCmd, pretext, setPretext, posttext, setPosttext, newCmd, setNewCmd}
}

function App() {
  const { targetTime, setTargetTime, targetTimezone, setTargetTimezone } =
    useTime();
  const {cmd, setCmd, pretext, setPretext, posttext, setPosttext, newCmd, setNewCmd} = useText()

  const [duration] = useCountdown(targetTime);

  const script = targetTime.isValid && targetTimezone
  ? `$(countdown ${targetTime.toFormat(
      // $(countdown Dec 25 2015 12:00:00 AM EST)
      "MMM dd yyyy hh:mm:ss a"
    )} ${targetTimezone})`
  : "invalid!!"

  const fullOutput = `!commands ${newCmd ? 'add' : 'edit'} ${pretext} ${script} ${posttext}`

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
          <Grid container spacing={3}>
            {/* ----- */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                disablePortal
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
                clearIcon= <RestoreIcon />
                clearText= "Reset to System"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DateTimePicker
                renderInput={(props) => <TextField {...props} />}
                label="DateTimePicker"
                value={targetTime}
                onChange={(newValue) => {
                  setTargetTime(newValue);
                }}
                onError={(e, val) => {
                  console.log(val);
                }}
              />
            </Grid>

            <Grid item xs={12}><Typography variant='h6' component='h2'>Config</Typography></Grid>
            <Grid item xs={8}>
              <TextField

              label="stream command"
              id="command"
              fullWidth
              value={cmd}
              onChange={(e)=>setCmd(e.target.value)}
              />
              </Grid>
              <Grid item xs={4}>
              <FormControlLabel control={<Switch disabled={!cmd} checked={newCmd} onChange={(e)=>setNewCmd(e.target.checked)} />} label="New?" />
              </Grid>

              <Grid item xs={12}>
              <TextField
              id="pretext"
              label="Pre-countdown text"
              fullWidth
              multiline
              value={pretext}
              onChange={(e)=>setPretext(e.target.value)}
              />
              </Grid>

              <Grid item xs={12}>
              <TextField
                fullWidth
                required
                disabled
                variant="outlined"
                id="script"
                label="Countdown script"
                value={
                  script
                }
              />
            </Grid>

              <Grid item xs={12}>
              <TextField
              id="posttext"
              label="Post-countdown text"
              fullWidth
              multiline
              value={posttext}
              onChange={(e)=>setPosttext(e.target.value)}
              />
              </Grid>

              <Grid item xs={12}><Typography variant='h6' component='h2'>Preview:</Typography></Grid>
            <Grid item xs={12}>
              <Typography><strong>You:</strong> <em>{fullOutput}</em></Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography><strong>Hapless Viewer:</strong> {cmd}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                <strong>Nightbot:</strong> {pretext} {formatCountdown(duration)} {posttext}
              </Typography>
            </Grid>
            {/* etc */}
            {/*
            <Grid item xs={12}>
              <TextField
                id="address2"
                name="address2"
                label="Address line 2"
                fullWidth
                autoComplete="shipping address-line2"
                variant="standard"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="city"
                name="city"
                label="City"
                fullWidth
                autoComplete="shipping address-level2"
                variant="standard"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="state"
                name="state"
                label="State/Province/Region"
                fullWidth
                variant="standard"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="zip"
                name="zip"
                label="Zip / Postal code"
                fullWidth
                autoComplete="shipping postal-code"
                variant="standard"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="country"
                name="country"
                label="Country"
                fullWidth
                autoComplete="shipping country"
                variant="standard"
              />
            </Grid> */}
          </Grid>
        </Container>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
