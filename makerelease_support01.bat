::-----------------------------------------------------------------
:: sets MYTEMPVAR to command parameter 1
::   - fails silently if MYTEMPVAR already has a value
::-----------------------------------------------------------------
@echo off
if not defined MYTEMPVAR set MYTEMPVAR=%1

