x <- commandArgs(TRUE)
x <- as.numeric(unlist(strsplit(x, ";")))

MW <- mean(x)
SD <- sd(x)
Med <- median(x)
Mad <- mad(x)

## Radius = 0.6
A1 <- 1.7756*Mad^2
A2 <- 1.4322*Mad^2
a2 <- -0.5034*Mad
b <- 1.8390*Mad
u <- A1*(x-Med)/Mad^2
v <- A2*(((x-Med)/Mad)^2-1)/Mad - a2
w <- pmin(1, b/sqrt(u^2 + v^2))
res <- c(Med, Mad) + c(mean(u*w), mean(v*w))

paste(round(c(MW, SD, Med, Mad, res), 3), collapse = ";")
