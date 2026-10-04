# Architecture Rules

- Native OAuth must start from Wooffy's production origin and return through `https://wooffy.app/auth`; Capacitor-local relative OAuth URLs produce an in-app 404.