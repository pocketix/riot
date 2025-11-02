# Test definitions for ApacheJmeter tests 

Definition of tests scenarios for Apache Jmeter test framework

### Requirements:   
    Java 8+
    ApacheJMeter installed


### Installation of Jmeter
#### Verify that you have install Java version 8 or above on your system
    java -version

#### Install on linux 

##### 1. Download source file

###### For Jmeter version 5.6.3

    $ wget https://downloads.apache.org/jmeter/binaries/apache-jmeter-5.6.3.tgz

##### or

Download from https://jmeter.apache.org/download_jmeter.cgi and locate in Binaries portion your desired version

##### 2. Unpack downloaded 

    tar -xvf apache-jmeter-5.6.3.tgz

##### or from GUI
##### 3. move unpacked folder to your desired folder
##### locate binary executable file in 
    apache-jmeter-5.6.3/bin/jmeter


#### Install on Windows
##### 1. Download binaries file 
##### Download 
From https://jmeter.apache.org/download_jmeter.cgi and locate in Binaries portion your desired version

##### 2. Unpack 
##### 3. Locate you execution .exe file
    /apache-jmeter-5.6.3/bin/jmeter.bat


### Run in GUI mode
##### It is advised NOT to run tests itself from GUI mode, because it can lead to performance issues!!!
Open your `` /apache-jmeter-5.6.3/bin `` folder.
And run: 

##### Linux
    ./jmeter
##### Windows 
    jmeter.bat

### Test scenarios
You can prepare test scenarios either in GUI mode of Jmeter application or you can edit .jmx file in your text editor.
Example test can be found in the: `` frontend/frontend_tests/ApacheJmeter_tests/example.jmx ``

### Jmeter help
Run `` jmeter -? ``

## Run JMeter with Docker (no local install)

If you prefer not to install JMeter locally, use a container image (example uses justb4/jmeter):

```bash
# Run JMeter in Docker (no local install)
docker run --rm \
    -v "$PWD/frontend/frontend_tests/ApacheJmeter_tests:/tests" \
    -v "$PWD/frontend/frontend_tests/ApacheJmeter_tests/results:/results" \
    -w /tests \
    --network host \
    justb4/jmeter:5.6.3 \
    -n -t example.jmx \
    -JbaseUrl=http://localhost:8080 \
    -l /results/result.jtl -e -o /results/report

```

Notes:
- On macOS/Windows Docker, use `http://host.docker.internal:8080` instead of localhost (and remove `--network host`).
- Ensure the frontend is already running at port 8080.



### Running the test
##### It is advised to run tests itself from command line!!
To run test located in `` ApacheJmeter_tests/example.jmx ``:
    `` jmeter -n -t ApacheJmeter_tests/example.jmx -l result.csv -e -o report ``
Where
``-n`` specifies run in non-Gui mode
``-t`` specifies location of test scenario
``-l`` specifies name of raw data output
``-e`` tells Jmeter to generate HTML report
``-o`` specifies folder where HTML report should be generated

## Quick start (CLI, recommended)

Run from the repository root so relative paths resolve correctly:

```bash
# Create results folder (ignored by git is recommended)
mkdir -p frontend/frontend_tests/ApacheJmeter_tests/results

# Run the example plan in non-GUI mode with HTML report
jmeter \
    -n \
    -t frontend/frontend_tests/ApacheJmeter_tests/example.jmx \
    -JbaseUrl=http://localhost:8080 \
    -Jusers=10 -JrampUp=5 -Jduration=60 \
    -l frontend/frontend_tests/ApacheJmeter_tests/results/result.jtl \
    -e -o frontend/frontend_tests/ApacheJmeter_tests/results/report
```

Then open the generated HTML report at:
`frontend/frontend_tests/ApacheJmeter_tests/results/report/index.html`



## Passing variables (base URL, users, credentials)

You can parameterize your test plan either via “User Defined Variables” in JMeter or pass runtime properties with `-J`:

```bash
jmeter -n -t example.jmx \
    -JbaseUrl=http://localhost:8080 \
    -Jusers=50 -JrampUp=10 -Jduration=120 \
    -Jusername=demo -Jpassword=demo
```

Use these `-J` properties inside JMeter as `${__P(baseUrl)}`, `${__P(users)}`, etc.

## Using CSV test data

Place a CSV file next to your `.jmx` and add a “CSV Data Set Config” element in JMeter.
Example CSV: `users.csv`

```csv
username,password
user1,pass1
user2,pass2
```

Reference in your requests with `${username}` and `${password}`.


## Recommended load profile and assertions

- Start with small load: `users=10`, `rampUp=10`, `duration=60` and increase gradually.
- Add Assertions:
    - Response code is 2xx
    - Response time thresholds (e.g., < 1000 ms)
    - Validate key text in responses when applicable

## Results and reports

- Raw results: `.jtl` or `.csv` file (machine-readable)
- HTML summary: open `results/report/index.html`
- Consider adding `frontend/frontend_tests/ApacheJmeter_tests/results/` to `.gitignore`.

## Troubleshooting

- Non HTTP response code: `java.net.ConnectException` → Check that the server is running and the URL/port is correct.
- SSLHandshakeException → Try `Use multipart/form-data for POST`, or disable certificate validation for test env only.
- High CPU/memory → Prefer non-GUI mode; increase JVM heap (in `bin/jmeter` set `HEAP`), reduce listeners during execution.
- “Too many open files” on Linux → increase `ulimit -n`.




## Author: Vít Farka

---

### Now follows text summary of test scenarios in ``frontend/frontend_tests/ApacheJmeter_tests`` 
#### 1. example.jmx
Basic test to access localhost:8080
