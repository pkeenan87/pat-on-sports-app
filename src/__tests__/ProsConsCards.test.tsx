import { render } from "@testing-library/react-native";
import React from "react";

import { ProsConsCards } from "../components/ProsConsCards";
import type { ProsConsSections } from "../lib/api";

const sample: ProsConsSections = {
  intro: [
    { type: "paragraph", text: "This one stings." },
    { type: "heading", text: "Quick take" },
  ],
  pros: ["Defense looked solid", "Mack Hollins was reliable"],
  cons: ["Turnovers hurt", "Red zone stalls"],
  hasPanels: true,
};

describe("ProsConsCards", () => {
  it("renders intro copy and both panel headings", async () => {
    const { getByText } = await render(<ProsConsCards prosCons={sample} />);

    expect(getByText("This one stings.")).toBeTruthy();
    expect(getByText("Quick take")).toBeTruthy();
    expect(getByText("Pros")).toBeTruthy();
    expect(getByText("Cons")).toBeTruthy();
    expect(getByText("Defense looked solid")).toBeTruthy();
    expect(getByText("Turnovers hurt")).toBeTruthy();
  });

  it("exposes an accessible label for the swipeable cards", async () => {
    const { getByLabelText } = await render(
      <ProsConsCards prosCons={sample} />
    );
    expect(getByLabelText("Pros and cons cards")).toBeTruthy();
  });
});
