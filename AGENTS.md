# Architecture Rules

- Native OAuth opens externally from Wooffy's production origin and returns through the `/auth` Universal Link; handle both warm and cold app launches.