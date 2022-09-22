import "./App.css";
import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material/styles";
import {
  AppBar,
  Autocomplete,
  Box,
  Container,
  Grid,
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
} from "luxon";
import { Timezones } from "./constants";

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

const units = ["years", "months", "days", "hours", "minutes", "seconds"];
function singular(str) {
  return str.slice(0, -1);
}
function DatetimeToCountdown(dt: DateTime): String {
  const dur = dt.diffNow(units);
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

const syszone = new SystemZone().name;

function App() {
  const [targetTimezone, setTargetTimezone] = useState(
    localStorage.timezone || syszone
  );
  Settings.defaultZone = targetTimezone;

  const [targetTime, setTargetTime] = useState(DateTime.now());

  useEffect(() => {
    localStorage.timezone = targetTimezone;
    Settings.defaultZone = targetTimezone;
    setTargetTime(targetTime.setZone(targetTimezone));
  }, [targetTimezone]);

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
                  setTargetTimezone(val || syszone);
                }}
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
              />
            </Grid>
            {/*  */}

            <Grid item xs={12}>
              <TextField
                required
                id="script"
                name="script"
                fullWidth
                variant="standard"
                value={DatetimeToCountdown(targetTime)}
              />
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
