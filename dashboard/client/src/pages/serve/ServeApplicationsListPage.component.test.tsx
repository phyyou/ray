import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { getActor } from "../../service/actor";
import { getServeApplications } from "../../service/serve";
import {
  ServeApplicationStatus,
  ServeDeploymentMode,
  ServeSystemActorStatus,
} from "../../type/serve";
import { TEST_APP_WRAPPER } from "../../util/test-utils";
import { ServeApplicationsListPage } from "./ServeApplicationsListPage";

jest.mock("../../service/actor");
jest.mock("../../service/serve");

const mockGetServeApplications = jest.mocked(getServeApplications);
const mockGetActor = jest.mocked(getActor);

describe("ServeApplicationsListPage", () => {
  it("renders list", async () => {
    expect.assertions(15);

    // Mock ServeController actor fetch
    mockGetActor.mockResolvedValue({
      data: {
        data: {
          detail: {
            state: "ALIVE",
          },
        },
      },
    } as any);

    mockGetServeApplications.mockResolvedValue({
      data: {
        http_options: { host: "1.2.3.4", port: 8000 },
        http_proxies: {
          foo: {
            node_id: "node:12345",
            status: ServeSystemActorStatus.STARTING,
            actor_id: "actor:12345",
          },
        },
        controller_info: {
          node_id: "node:12345",
          actor_id: "actor:12345",
        },
        proxy_location: ServeDeploymentMode.EveryNode,
        applications: {
          home: {
            name: "home",
            route_prefix: "/",
            message: null,
            status: ServeApplicationStatus.RUNNING,
            deployed_app_config: {
              import_path: "home:graph",
            },
            last_deployed_time_s: new Date().getTime() / 1000,
            deployments: {
              FirstDeployment: {},
              SecondDeployment: {},
            },
          },
          "second-app": {
            name: "second-app",
            route_prefix: "/second-app",
            message: null,
            status: ServeApplicationStatus.DEPLOYING,
            deployed_app_config: {
              import_path: "second_app:graph",
            },
            last_deployed_time_s: new Date().getTime() / 1000,
            deployments: {
              ThirdDeployment: {},
            },
          },
        },
      },
    } as any);

    render(<ServeApplicationsListPage />, { wrapper: TEST_APP_WRAPPER });

    const user = userEvent.setup();

    await screen.findByText("System");
    expect(screen.getByText("System")).toBeVisible();
    expect(screen.getByText("1.2.3.4")).toBeVisible();
    expect(screen.getByText("8000")).toBeVisible();

    // HTTP Proxy row
    expect(screen.getByText("HTTPProxyActor:node:12345")).toBeVisible();
    expect(screen.getByText("STARTING")).toBeVisible();

    // Serve Controller row
    expect(screen.getByText("Serve Controller")).toBeVisible();
    expect(screen.getByText("HEALTHY")).toBeVisible();

    // First row
    expect(screen.getByText("home")).toBeVisible();
    expect(screen.getByText("/")).toBeVisible();
    expect(screen.getByText("RUNNING")).toBeVisible();

    // Second row
    expect(screen.getByText("second-app")).toBeVisible();
    expect(screen.getByText("/second-app")).toBeVisible();
    expect(screen.getByText("DEPLOYING")).toBeVisible();

    // Config dialog
    await user.click(screen.getAllByText("View")[0]);
    await screen.findByText(/import_path: home:graph/);
    expect(screen.getByText(/import_path: home:graph/)).toBeVisible();

    expect(screen.getByText("Metrics")).toBeVisible();
  });
});