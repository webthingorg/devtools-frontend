# Architecture of DevTools

This document explains the high-level architecture as well as any considerations that were made along the way.
The document is evolving and will be updated whenever architectural changes are being made.

## Guiding principles

Throughout this document, references are included to relevant [Web Platform Design Principles], whenever they are applicable for that specific section.
It is recommended to be familiar with the Web Platform Design Principles prior to reading to this document, but it is not required.
There are additional DevTools-specific guiding principles that are listed in this section.

### Load only what is necessary

DevTools is a large web application.
It contains dozens of features, most of them are distinct.
As such, loading all features up front is infeasible and can lead to large startup times of DevTools.
The DevTools architecture should encourage granular implementations of features, lazy loading the minimal amount of code to make features work.

See also:
* [Put user needs first]

### Prefer web platform features whenever possible

DevTools ships as part of Chromium-based browsers and therefore is long-living.
Code that is shipped today can live on for years, even decades.
Therefore, web best practices constantly evolve during the lifespan of DevTools.
To avoid frequent rewrites of features, each feature should be implemented with longevity in mind.
Web platform features are standardized and designed to be supported ad infinitum.
Whenever possible, prefer the usage of web platform features over custom solutions, as custom solutions require constant maintenance and are more likely to become out-of-date.

See also:
* [Prefer simple solutions]
* [Put user needs first]

### Design with continuous deployment in mind

DevTools ships every single day in Canary builds of Chromium-based browsers.
It is therefore risky to halt development during a migration (even for a couple of weeks), as DevTools can cause Canary builds to break and effect not just end-users, but also engineers working on the web platform itself.
The symbiosis of the web platform and DevTools means that DevTools itself must be kept up-to-date, to support a continuously evolving platform.

Migrations should therefore be gradual and allow for continuous deployment of DevTools in Canary builds.
The migrations will thus have to take into account not just the desired end solution, but also the limitations of today's implementation.
In the end, it is not possible to predict when migrations are completed, which means that the codebase can be under migration for a significant amount of time.
Ensure that migrations do not (strongly) negatively impact feature development and evolution of the wider web platform and can be completed in a timely fashion.

See also:
* [Put user needs first]
* [Prefer web platform features whenever possible]

### Use flexible third_party libraries whenever necessary

Not all requirements of DevTools can be fulfilled by web platform features alone.
There will be situations in which third_party libraries (ideally closely built on top of web platform features) are the appropriate solution.
Every third_party library introduced in DevTools adds risk to the longterm maintenance of the overall product.
Therefore, each third_party library that DevTools uses should be flexible: a library should be (relatively) easy to be removed from the product.

In practice, this means that any new third_party library must allow for gradual introduction in the codebase, but (if required) also gradually removal.
Since third_party libraries can become unmaintained, gradual removal allows continued development of DevTools features, while the impact of the deprecation is dealt with.
If a third_party library is difficult to remove and has a broad impact on the overall codebase, it could cause a halt of development of DevTools features.
Since the web platform is continuously evolving and DevTools is a part of the platform focused on web developers, halting feature development can have a negative impact on the wider web platform.

Concretely, the introduction of a framework that takes control of the lifecycle of (parts of) DevTools is practically impossible.
Such frameworks require difficult-to-execute migrations and typically don't allow for gradual removals.
Moreover, decisions made by maintainers of third_party frameworks could cause significant maintenance churn for DevTools maintainers.

Note that in this section, the definition of "framework" can differ based on point-of-views of stakeholders and could apply more broadly than initially expected.
Make sure to evaluate third_party packages based on impact on the DevTools codebase, which could be larger than third_party maintainers might have intended.
In other words: even if a third_party package is advertised as a library, it could still be considered as a framework from the perspective of DevTools maintainers.

See also:
* [Load only what is necessary]
* [Design with continuous deployment in mind]

### Limit implementation possibilities while providing maximum flexibility

Typically, there are multiples ways to implement application features on the web.
A direct result of the flexibility of the web is the proliferation of different solutions to the same problem.
A negative consequence of the flexibility is the wide variety of solutions and corresponding maintenance cost in the longterm future.
The DevTools architecture should limit the amount of possible solutions to various problems, yet providing maximum flexibility to engineers implementing DevTools features.

Sadly, that is easier said than done.
Even when taking this principle into account when working on DevTools' architecture, it can be relatively easy to discover "architectural regressions" years later.
On the flipside, it can be appealing to be overly restrictive, to avoid such "architectural regressions".
However, "unnecessary" (this qualification can be subjective and differ based on point-of-view) restrictions can have a strong negative impact on development of DevTools features and therefore can cause more problems on its own.

Balancing the architectural requirements to ensure a stable and fast-loading DevTools versus the needs of implementing new DevTools features is a continuously evolving process.
To ensure a healthy balance, a periodic evaluation can be useful to address potential architectural technical debt.

See also:
* [Prefer simple solutions]
* [Load only what is necessary]

<!-- Links -->

[Web Platform Design Principles]: https://w3ctag.github.io/design-principles/
[Put user needs first]: https://w3ctag.github.io/design-principles/#priority-of-constituencies
[Prefer simple solutions]: https://w3ctag.github.io/design-principles/#simplicity
[Load only what is necessary]: #load-only-what-is-necessary
[Prefer web platform features whenever possible]: #prefer-web-platform-features-whenever-possible
[Design with continuous deployment in mind]: #design-with-continuous-deployment-in-mind
