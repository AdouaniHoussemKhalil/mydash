import { describe, expect, it } from "vitest";
import { colorSchema, escapeLike, SWATCHES } from "./colors";

describe("colorSchema", () => {
  it("accepte les pastilles proposées et null", () => {
    for (const swatch of SWATCHES) expect(colorSchema.safeParse(swatch).success).toBe(true);
    expect(colorSchema.safeParse(null).success).toBe(true);
  });

  it("refuse tout autre format", () => {
    for (const value of ["red", "#FFF", "#GGGGGG", "rgb(0,0,0)"]) {
      expect(colorSchema.safeParse(value).success).toBe(false);
    }
  });
});

describe("escapeLike", () => {
  it("échappe les jokers ILIKE", () => {
    expect(escapeLike("100%_ok\\")).toBe("100\\%\\_ok\\\\");
    expect(escapeLike("dev")).toBe("dev");
  });
});
