import {
  MantineThemeProvider,
  createTheme,
  Loader,
  Center,
} from "@mantine/core";
import { RingLoader } from "./RingLoader";

const theme = createTheme({
  components: {
    Loader: Loader.extend({
      defaultProps: {
        loaders: { ...Loader.defaultLoaders, ring: RingLoader },
        type: "ring",
      },
    }),
  },
});

export function CustomLoader() {
  return (
    <MantineThemeProvider theme={theme}>
      <Center style={{ height: "100vh" }}>
        <Loader color="green" />
      </Center>
    </MantineThemeProvider>
  );
}
