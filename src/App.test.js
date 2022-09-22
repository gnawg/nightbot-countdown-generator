import { render, screen } from "@testing-library/react";
import { DateTime } from "luxon";
import App from "./App";

const inputTime = DateTime.fromISO("2022-10-22T17:00:00", { zone: "PST8PDT" });
