# rapidgoat-challenge
Contains my solutions and implementations for the technical challenge provided by RapidGoat. 

## Solution 1 : Reverse proxy to change the display
The first solution is to use the reverse proxy server to do a little twist on the display, so you can make the difference between the two environments.

- Check the steps here: [Solution 1](Playground1/README.md)
![alt text](img/image.png)



## Solution 2 : Environment separation using secrets
The second solution is to use environment-specific admin secrets to enforce environment separation. This way, you can ensure that only trusted users have access to the production environment.
![alt text](image.png)
- Check the steps here: [Solution 2](Playground2/README.md)