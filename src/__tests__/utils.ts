import test from "tape";
import { sleep, ToastError, ToastSuccess } from "../utils";

test("sleep for half second", async (t) => {
  t.ok(sleep(500), "function only, not measured time");
  t.end();
});

test("success toast", async (t) => {
  t.ok(ToastSuccess);
  t.end();
});

test("error toast", async (t) => {
  t.ok(ToastError);
  t.end();
});
