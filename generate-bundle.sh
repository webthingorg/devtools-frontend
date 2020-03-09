gen-bundle \
    -dir front_end \
    -baseURL http://localhost:8080/ \
    -primaryURL http://localhost:8080/devtools_app.html \
    -headerOverride 'Access-Control-Allow-Origin: *' \
    -o bundle/devtools.wbn
