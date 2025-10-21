# Test definitions for ApacheJmeter tests 

Definition of tests scenarios for Apache Jmeter test framework

### Requirements:   
    Java 8+
    ApacheJMeter installed

Author: Vít Farka


### Run

`` jmeter -n -t frontend_tests/ApacheJmeter_tests/example.jmx -l result.csv -e -o report ``¨

Will create report forlder with .html report with graphs and statistics.

### Test scenario: example.jmx
Basic test to access localhost:8080