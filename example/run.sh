#!/bin/bash

go run github.com/millergarym/md-tmpl@v1.3.2 \
    --exist-on-err \
    --skip-pad-code \
    -d . \
    -w README.md