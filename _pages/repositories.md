---
layout: page
permalink: /repositories/
title: repositories
description: Code for phage genomics and bioinformatics.
nav: true
nav_order: 4
---

<link rel="stylesheet" href="{{ '/assets/css/projects.css' | relative_url | bust_file_cache }}">

{% assign gh_user = site.data.repositories.github_profile %}

<div class="repo-grid">
  {% for repo in site.data.repositories.repos %}
  <a class="repo-card" href="https://github.com/{{ gh_user }}/{{ repo.name }}" target="_blank" rel="noopener noreferrer">
    <span class="repo-card-name"><i class="fa-brands fa-github"></i> {{ repo.name }}</span>
    {% if repo.description %}<span class="repo-card-desc">{{ repo.description }}</span>{% endif %}
    {% if repo.language %}<span class="repo-card-lang">{{ repo.language }}</span>{% endif %}
  </a>
  {% endfor %}
</div>

<p class="repo-profile-link">More on <a href="https://github.com/{{ gh_user }}" target="_blank" rel="noopener noreferrer">github.com/{{ gh_user }}</a>.</p>
