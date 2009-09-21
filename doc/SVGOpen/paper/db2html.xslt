<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:ng="http://docbook.org/docbook-ng"
  xmlns:db="http://docbook.org/ns/docbook"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  exclude-result-prefixes="db ng xlink"
  version='1.0'>
  
  <!-- XSLT for converting from DocBook format to XHTML + CSS
    Written by: Philip Mansfield
    History:
    version 1.0 - 24 August 2004 
    Created to handle ideadb subset (for XML 2004 Conference papers)
    version 1.01 - 26 August 2004
    Added support for customizing the biography title
    version 1.02 - 27 August 2004
    Added support for xreflabel
    version 1.1 - 10 January 2005
    Added customization parameters, improved table and image support
    Copyright:
    (c) 2004-5 Schema Software Inc.
    You may use, reproduce, modify or redistribute this software under
    the condition that you include this copyright notice in all copies
    and you do not sell it or include it in a sold product.
    For more information, visit http://www.schemasoft.com or write to 
    info@schemasoft.com -->
  
  
<!-- Parameter determining path to CSS file referenced by HTML -->
<xsl:param name="cssHref">http://www.svgopen.org/2008/docbook/ideadb.css</xsl:param>

<!-- Parameter to control whether keywords are displayed -->
<xsl:param name="showKeywords">true</xsl:param> <!-- 'true' or 'false' -->

<!-- Parameter to control whether <address> content has linespecific formatting -->
<xsl:param name="linespecificAddress">false</xsl:param> <!-- 'true' or 'false' -->

<xsl:output method="xml" doctype-public="-//W3C//DTD XHTML 1.1//EN" doctype-system="http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd" indent="no" omit-xml-declaration="yes" />
<xsl:strip-space elements="db:*"/>
<xsl:preserve-space elements="db:address db:literallayout db:bibliomixed"/>

<!-- NOTE: The internal CSS is for a few style rules that are specified
     in DocBook content; all other style rules should be in the external CSS -->
<xsl:template match="db:article">
  <html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <xsl:apply-templates select="db:info/db:title|db:info/db:keywordset|db:info/db:author|db:info/db:authorgroup/db:author" mode="head"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <meta http-equiv="Content-Style-Type" content="text/css"/>
    <style type="text/css">
ul.simple {list-style-type: none}
ul.bulleted {list-style-type: disc}
ul.openBulleted {list-style-type: circle}
ul.dashed {list-style-type: square}
ol.arabic {list-style-type: decimal}
ol.ualpha {list-style-type: upper-alpha}
ol.uroman {list-style-type: upper-roman}
ol.lalpha {list-style-type: lower-alpha}
ol.lroman {list-style-type: lower-roman}
ol.ftnote {list-style-type: decimal}
    </style>
    <link rel="stylesheet" type="text/css" href="{$cssHref}"/>
  </head>
  <body>
    <xsl:apply-templates select="db:info/db:title"/>
    <xsl:apply-templates select="db:info/db:subtitle"/>
    <xsl:apply-templates select="db:info"/>
    <hr class="upperBorder"/>
    <h2 class="tocHeader">Table of Contents</h2>
    <hr class="lowerBorder"/>
    <p class="toc">
      <xsl:apply-templates select=".//db:title" mode="toc"/>
      <xsl:apply-templates select="db:ackno|db:bibliography" mode="toc"/>
      <xsl:apply-templates select="/descendant::db:footnote[position()=1]" mode="toc"/>
    </p>
    <xsl:apply-templates select="db:*[not(self::db:title or self::db:subtitle or self::db:info)]"/>
    <xsl:apply-templates select="/descendant::db:footnote[position()=1]" mode="footerStart"/>
    <p class="credits"><small>XHTML rendition made possible by
      <a href="http://www.schemasoft.com">SchemaSoft</a>&apos;s
      <a href="http://www.schemasoft.com/DocBook/">Document Interpreter</a>
      <xsl:text disable-output-escaping="yes">&amp;trade;</xsl:text>
      technology.</small>
    </p>
    </body>
  </html>
</xsl:template>

<!-- Front matter -->
<xsl:template match="db:info">
    <xsl:apply-templates select="db:keywordset"/>
    <xsl:apply-templates select="db:author|db:authorgroup/db:author"/>
    <xsl:apply-templates select="db:abstract"/>
</xsl:template>

<xsl:template match="db:title" mode="head">
  <title><xsl:value-of select=".//text()"/></title>
</xsl:template>

<xsl:template match="db:keywordset" mode="head">
  <meta name="keywords">
    <xsl:attribute name="content">
      <xsl:apply-templates mode="head"/>
    </xsl:attribute>
  </meta>
</xsl:template>

<xsl:template match="db:keyword[position()&gt;1]" mode="head">
  <xsl:text>, </xsl:text>
  <xsl:apply-templates/>
</xsl:template>

<xsl:template match="db:keywordset">
  <xsl:if test="$showKeywords='true'">
    <p class="keyword">
      <i class="keywordHeader"><xsl:text>Keywords: </xsl:text></i>
      <xsl:apply-templates/>
    </p>
  </xsl:if>
</xsl:template>

<xsl:template match="db:keyword[1]">
  <xsl:call-template name="db:keywordAnchor"/>
  <xsl:apply-templates/>
</xsl:template>

<xsl:template match="db:keyword[position()&gt;1]">
  <xsl:text>, </xsl:text>
  <xsl:call-template name="db:keywordAnchor"/>
  <xsl:apply-templates/>
</xsl:template>

<xsl:template match="db:author" mode="head">
  <meta name="author">
    <xsl:attribute name="content">
      <xsl:apply-templates select="db:personname/db:honorific|db:personname/db:firstname|db:personname/db:othername|db:personname/db:surname|db:personname/db:lineage"/>
    </xsl:attribute>
  </meta>
</xsl:template>

<xsl:template match="db:honorific">
  <xsl:apply-templates/>
  <xsl:text> </xsl:text>
</xsl:template>

<xsl:template match="db:othername | db:surname">
  <xsl:text> </xsl:text>
  <xsl:apply-templates/>
</xsl:template>

<xsl:template match="db:lineage">
  <xsl:text>, </xsl:text>
  <xsl:apply-templates/>
</xsl:template>

<xsl:template match="db:article/db:info/db:title[string()]">
  <h1 class="title"><xsl:apply-templates/></h1>
</xsl:template>

<xsl:template match="db:article/db:info/db:subtitle[string()]">
  <h2 class="subt"><xsl:apply-templates/></h2>
</xsl:template>

<xsl:template match="db:info/db:author|db:info/db:authorgroup/db:author">
  <p class="author">
    <span class="authorName">
      <xsl:apply-templates select="db:personname/db:honorific"/>
      <xsl:apply-templates select="db:personname/db:firstname"/>
      <xsl:apply-templates select="db:personname/db:othername"/>
      <xsl:apply-templates select="db:personname/db:surname"/>
      <xsl:apply-templates select="db:personname/db:lineage"/>
    </span>
    <xsl:apply-templates select="db:affiliation/db:jobtitle"/>
    <br/>
    <xsl:apply-templates select="db:affiliation/db:org/db:*[not(self::db:address)]"/>
    <xsl:if test="$linespecificAddress='false'">
      <xsl:apply-templates select="db:affiliation/db:org/db:address"/>
    </xsl:if>
  </p>
  <xsl:if test="$linespecificAddress='true'">
    <xsl:apply-templates select="db:affiliation/db:org/db:address" mode="linespecific"/>
  </xsl:if>
  <xsl:apply-templates select="db:personblurb"/>
</xsl:template>

<xsl:template match="db:shortaffil|db:jobtitle|db:orgname|db:orgdiv">
  <br/><xsl:apply-templates/>
</xsl:template>

<xsl:template match="db:address">
  <br /><xsl:apply-templates/>
</xsl:template>

<xsl:template match="db:address" mode="linespecific">
  <pre class="author address"><xsl:apply-templates mode="linespecific"/></pre>
</xsl:template>

<xsl:template match="db:email|db:address/db:email" mode="linespecific">
  <a class="email" href="mailto:{text()}"><xsl:apply-templates/></a>
</xsl:template>

<!-- Insert newline only if previous address content has already been rendered -->
<xsl:template match="db:address/db:*[position() &gt; 1 or
  preceding-sibling::text()[normalize-space()]]">
  <br /><xsl:apply-templates/>
</xsl:template>

<xsl:template match="db:address/db:email|db:email" priority="0.75">
  <a class="email" href="mailto:{text()}"><xsl:apply-templates/></a>
</xsl:template>

<xsl:template match="db:address/db:email[preceding-sibling::db:* or
  preceding-sibling::text()[normalize-space()]]" priority="1">
  <br /><a class="email" href="mailto:{text()}"><xsl:apply-templates/></a>
</xsl:template>

<xsl:template match="db:personblurb">
  <p class="bioHeader">
    <i>
      <xsl:if test="not(title)">
        <xsl:text>Biography</xsl:text>
      </xsl:if>
      <xsl:apply-templates select="db:title"/>
    </i>
  </p>
  <blockquote class="bio">
    <xsl:apply-templates select="db:*[not(self::db:title)]"/>
  </blockquote>
</xsl:template>

<xsl:template match="db:personblurb/db:title">
  <xsl:apply-templates/>
</xsl:template>

<xsl:template match="db:personblurb/db:para[1] | db:abstract/db:para[1]">
  <p>
    <xsl:apply-templates select="../@xml:id" />
    <xsl:apply-templates select="@xml:id" />
    <xsl:apply-templates/>
  </p>
</xsl:template>

<xsl:template match="db:info/db:abstract">
  <hr class="upperBorder"/>
  <h2 class="abstractHeader">
    <xsl:if test="not(string(db:title))">Abstract</xsl:if>
    <xsl:apply-templates select="db:title"/>
  </h2>
  <hr class="lowerBorder"/>
  <div class="abstract">
    <xsl:apply-templates select="db:*[not(self::db:title)]"/>
  </div>
</xsl:template>

<xsl:template match="db:abstract">
  <div class="componentAbstract">
    <b>
      <xsl:if test="not(title)">Abstract</xsl:if>
      <xsl:apply-templates select="db:title"/>
      <xsl:text>: </xsl:text>
    </b>
    <xsl:apply-templates select="db:*[not(self::db:title)]"/>
  </div>
</xsl:template>

<xsl:template match="db:abstract/db:title">
  <xsl:apply-templates/>
</xsl:template>

<!-- Rear matter -->
<xsl:template match="db:ackno">
  <h2 class="acknowlHeader">
    <a id="S.Acknowledgements">Acknowledgements</a>
  </h2>
  <div class="acknowl">
    <xsl:apply-templates/>
  </div>
</xsl:template>

<xsl:template match="db:bibliography">
  <h2 class="bibliogHeader">
    <a id="S.Bibliography">
      <xsl:if test="not(string(db:title))">Bibliography</xsl:if>
      <xsl:apply-templates select="db:title"/>
    </a>
  </h2>
  <dl class="bibliog">
    <xsl:apply-templates select="db:*[not(self::db:title)]"/>
  </dl>
</xsl:template>

<xsl:template match="db:bibliography/db:title">
  <xsl:apply-templates/>
</xsl:template>

<xsl:template match="db:bibliomixed">
  <dt class="bib">
    <xsl:apply-templates select="@xml:id" mode="attr"/>
    <xsl:choose>
      <xsl:when test="db:abbrev">
        <xsl:apply-templates select="db:abbrev[1]"/>
      </xsl:when>
      <xsl:when test="@xreflabel">
        <xsl:apply-templates select="@xreflabel" mode="bibAbbrev"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:apply-templates select="@xml:id" mode="bibAbbrev"/>
      </xsl:otherwise>
    </xsl:choose>
  </dt>
  <dd class="pub">
    <xsl:apply-templates select="db:*[not(self::db:abbrev)]
      | db:abbrev[position()&gt;1] | text()"/>
  </dd>
</xsl:template>

<xsl:template match="db:bibliomixed/db:abbrev[1]">
  <b>[<xsl:apply-templates/>]</b>
</xsl:template>

  <xsl:template match="db:bibliomixed/@xreflabel | db:bibliomixed/@xml:id"
  mode="bibAbbrev">
  <b>[<xsl:value-of select="."/>]</b>
</xsl:template>

  <xsl:template match="db:volumenum">
  <b><xsl:apply-templates/></b>
</xsl:template>

<!-- Inline text elements -->
  <xsl:template match="db:emphasis">
  <i>
    <xsl:apply-templates select="@xml:id"/>
    <xsl:apply-templates/>
  </i>
</xsl:template>

  <xsl:template match="db:emphasis[@role='bold' or @role='strong']">
  <b>
    <xsl:apply-templates select="@xml:id"/>
    <xsl:apply-templates/>
  </b>
</xsl:template>

  <xsl:template match="db:emphasis[@role='big']">
  <big>
    <xsl:apply-templates select="@xml:id"/>
    <xsl:apply-templates/>
  </big>
</xsl:template>

  <xsl:template match="db:emphasis[@role='small']">
  <small>
    <xsl:apply-templates select="@xml:id"/>
    <xsl:apply-templates/>
  </small>
</xsl:template>

  <xsl:template match="db:code | db:command | db:filename | db:literal">
  <code class="{local-name()}">
    <xsl:apply-templates select="@xml:id"/>
    <xsl:apply-templates/>
  </code>
</xsl:template>

  <xsl:template match="db:subscript">
  <sub>
    <xsl:apply-templates select="@xml:id"/>
    <xsl:apply-templates/>
  </sub>
</xsl:template>

  <xsl:template match="db:superscript">
  <sup>
    <xsl:apply-templates select="@xml:id"/>
    <xsl:apply-templates/>
  </sup>
</xsl:template>

  <xsl:template match="db:sgmltag">
  <xsl:variable name="codeClass">
    <xsl:text>sgmltag</xsl:text>
    <xsl:apply-templates select="@class"/>
  </xsl:variable>
  <code class="{$codeClass}">
    <xsl:apply-templates/>
  </code>
</xsl:template>

  <xsl:template match="db:sgmltag/@class">
  <xsl:text> </xsl:text>
  <xsl:value-of select="."/>
</xsl:template>

<!-- Paragraphs -->
  <xsl:template match="db:para">
  <p>
    <xsl:apply-templates select="@xml:id"/>
    <xsl:apply-templates/>
  </p>
</xsl:template>

  <xsl:template match="db:caption/db:*[position()=1 and self::db:para]">
  <xsl:apply-templates select="@xml:id"/>
  <xsl:apply-templates/>
</xsl:template>

  <xsl:template match="db:caption/db:*[position()&gt;1 and self::db:para]">
  <br />
  <xsl:apply-templates select="@xml:id"/>
  <xsl:apply-templates/>
</xsl:template>

  <xsl:template match="db:listitem/db:*[position()=1 and self::db:para]">
  <xsl:apply-templates select="@xml:id"/>
  <xsl:apply-templates/>
</xsl:template>

  <xsl:template match="db:listitem/db:*[position()&gt;1 and self::db:para]">
  <br />
  <xsl:apply-templates select="@xml:id"/>
  <xsl:apply-templates/>
</xsl:template>

<!-- Inline keywords and anchors generated for all keywords -->
<xsl:template match="db:para/db:keyword" name="db:keywordAnchor">
  <xsl:variable name="anchor">
    <xsl:text>K</xsl:text>
    <xsl:number format="1." level="any"/>
    <xsl:value-of select="translate(text(),' ','.')"/>
  </xsl:variable>
  <a id="{$anchor}" title="{text()}"/>
</xsl:template>

<!-- Citations -->
  <xsl:template match="db:citetitle">
  <cite>
    <xsl:apply-templates/>
  </cite>
</xsl:template>

<!-- Quotes -->
  <xsl:template match="db:blockquote">
  <blockquote class="lquote">
    <xsl:apply-templates select="db:*[not(self::db:attribution)]"/>
    <xsl:apply-templates select="db:attribution"/>
  </blockquote>
</xsl:template>

  <xsl:template match="db:attribution">
  <p class="attribution">
    <i><xsl:text disable-output-escaping="yes">&amp;mdash; </xsl:text>
    <xsl:apply-templates/></i>
  </p>
</xsl:template>

  <xsl:template match="db:quote">
  <xsl:text disable-output-escaping="yes">&amp;#x201C;</xsl:text>
    <xsl:apply-templates/>
  <xsl:text disable-output-escaping="yes">&amp;#x201D;</xsl:text>
</xsl:template>

<!-- Acronyms -->
  <xsl:template match="db:acronym">
  <acronym>
    <a>
      <xsl:apply-templates select="@refid"/>
      <xsl:apply-templates/>
    </a>
  </acronym>
</xsl:template>

  <xsl:template match="db:acronym/@refid">
  <xsl:attribute name="href">
    <xsl:text>#</xsl:text>
    <xsl:value-of select="."/>
  </xsl:attribute>
</xsl:template>

  <xsl:template match="db:acronym.grp/db:expansion">
  <xsl:apply-templates select="@xml:id"/>
  <xsl:text> (</xsl:text>
    <xsl:apply-templates/>
  <xsl:text>) </xsl:text>
</xsl:template>

<!-- Lists -->
  <xsl:template match="db:listitem">
  <li>
    <xsl:apply-templates select="@xml:id"/>
    <xsl:apply-templates/>
  </li>
</xsl:template>

  <xsl:template match="db:itemizedlist" name="randTemplate">
  <xsl:apply-templates select="db:title"/>
  <ul>
    <xsl:apply-templates select="@mark"/>
    <xsl:if test="not(@mark)">
      <xsl:attribute name="class">bulleted</xsl:attribute>
    </xsl:if>
    <xsl:apply-templates select="db:listitem"/>
  </ul>
</xsl:template>

  <xsl:template match="db:para/db:itemizedlist">
  <xsl:text disable-output-escaping="yes">&lt;/p></xsl:text>
  <xsl:call-template name="randTemplate"/>
  <xsl:text disable-output-escaping="yes">&lt;p></xsl:text>
</xsl:template>

  <xsl:template match="db:listitem/db:para/db:itemizedlist" priority="1">
  <xsl:call-template name="randTemplate"/>
</xsl:template>

<xsl:template match="db:itemizedlist/db:title[string()]">
  <h6 class="randlistTitle">
    <xsl:apply-templates/>
  </h6>
</xsl:template>

<xsl:template match="db:itemizedlist/@mark"/>

<xsl:template match="db:itemizedlist/@mark[.='none']" priority="1">
  <xsl:attribute name="class">simple</xsl:attribute>
</xsl:template>

<xsl:template match="db:itemizedlist/@mark[.='disc']" priority="1">
  <xsl:attribute name="class">bulleted</xsl:attribute>
</xsl:template>

<xsl:template match="db:itemizedlist/@mark[.='circle']" priority="1">
  <xsl:attribute name="class">openBulleted</xsl:attribute>
</xsl:template>

<xsl:template match="db:itemizedlist/@mark[.='square']" priority="1">
  <xsl:attribute name="class">dashed</xsl:attribute>
</xsl:template>

<xsl:template match="db:orderedlist" name="seqTemplate">
  <xsl:apply-templates select="db:title"/>
  <ol>
    <xsl:apply-templates select="@numeration"/>
    <xsl:if test="not(@numeration)">
      <xsl:attribute name="class">arabic</xsl:attribute>
    </xsl:if>
    <xsl:apply-templates select="db:listitem"/>
  </ol>
</xsl:template>

<xsl:template match="db:para/db:orderedlist">
  <xsl:text disable-output-escaping="yes">&lt;/p></xsl:text>
  <xsl:call-template name="seqTemplate"/>
  <xsl:text disable-output-escaping="yes">&lt;p></xsl:text>
</xsl:template>

<xsl:template match="db:listitem/db:para/db:orderedlist" priority="1">
  <xsl:call-template name="seqTemplate"/>
</xsl:template>

<xsl:template match="db:orderedlist/db:title[string()]">
  <h6 class="seqlistTitle">
    <xsl:apply-templates/>
  </h6>
</xsl:template>

<xsl:template match="db:orderedlist/@numeration"/>

<xsl:template match="db:orderedlist/@numeration[.='arabic']" priority="1">
  <xsl:attribute name="class">arabic</xsl:attribute>
</xsl:template>

<xsl:template match="db:orderedlist/@numeration[.='upperalpha']" priority="1">
  <xsl:attribute name="class">ualpha</xsl:attribute>
</xsl:template>

<xsl:template match="db:orderedlist/@numeration[.='upperroman']" priority="1">
  <xsl:attribute name="class">uroman</xsl:attribute>
</xsl:template>

<xsl:template match="db:orderedlist/@numeration[.='loweralpha']" priority="1">
  <xsl:attribute name="class">lalpha</xsl:attribute>
</xsl:template>

<xsl:template match="db:orderedlist/@numeration[.='lowerroman']" priority="1">
  <xsl:attribute name="class">lroman</xsl:attribute>
</xsl:template>

<xsl:template match="db:variablelist" name="defTemplate">
  <xsl:apply-templates select="db:title"/>
  <dl>
    <xsl:apply-templates select="db:*[not(self::db:title)]"/>
  </dl>
</xsl:template>

<xsl:template match="db:para/db:variablelist">
  <xsl:text disable-output-escaping="yes">&lt;/p></xsl:text>
  <xsl:call-template name="defTemplate"/>
  <xsl:text disable-output-escaping="yes">&lt;p></xsl:text>
</xsl:template>

<xsl:template match="db:listitem/db:para/db:variablelist" priority="1">
  <xsl:call-template name="defTemplate"/>
</xsl:template>

<xsl:template match="db:variablelist/db:title[string()]">
  <h6 class="deflistTitle">
    <xsl:apply-templates/>
  </h6>
</xsl:template>

<xsl:template match="db:term">
  <dt>
    <xsl:apply-templates/>
  </dt>
</xsl:template>

  <xsl:template match="db:varlistentry/db:listitem">
  <dd>
    <xsl:apply-templates/>
  </dd>
</xsl:template>

<!-- Preformatted -->
  <xsl:template match="db:programlisting">
  <table class="codeBlock">
    <xsl:apply-templates select="@xml:id" mode="attr"/>
    <tr><td><pre>
      <xsl:apply-templates/>
     </pre></td></tr>
  </table>
</xsl:template>

  <xsl:template match="db:literallayout">
  <pre class="literallayout">
    <xsl:apply-templates select="@xml:id" mode="attr"/>
    <xsl:apply-templates/>
  </pre>
</xsl:template>

<!-- Notes -->
  <xsl:template match="db:note">
  <table class="note">
    <tr>
      <td>
        <p>
          <span class="noteHeader">
            <xsl:if test="not(title)">
              <xsl:text>NOTE</xsl:text>
            </xsl:if>
            <xsl:apply-templates select="db:title"/>
            <xsl:text>: </xsl:text>
          </span>
          <xsl:apply-templates select="db:para[1]/node()"/>
        </p>
        <xsl:apply-templates select="db:para[position()&gt;1]"/>
       </td>
    </tr>
  </table>
</xsl:template>

  <xsl:template match="db:note/db:title">
  <xsl:apply-templates/>
</xsl:template>

<!-- Hyperlinks -->
  <xsl:template match="db:link">
  <a href="{@xlink:href}">
    <xsl:apply-templates/>
    <xsl:if test="not(text() or *)">
      <xsl:value-of select="@xlink:href"/>
    </xsl:if>
  </a>
</xsl:template>

<!-- Footnotes -->
  <xsl:template match="db:footnoteref">
  <a href="#{@linkend}" class="fnref"><b>
    <xsl:apply-templates select="//db:footnote[@xml:id=current()/@linkend]" mode="reference"/>
  </b></a>
</xsl:template>

  <xsl:template match="db:footnote|db:footnote//db:*" mode="reference" priority="-0.1">
  <xsl:text>[</xsl:text>
    <xsl:value-of select="count(preceding::db:footnote)+count(ancestor-or-self::db:footnote)"/>
  <xsl:text>]</xsl:text>
</xsl:template>

  <xsl:template match="db:footnote">
    <a href="#FT{count(preceding::db:footnote)+count(ancestor-or-self::db:footnote)}" class="fnref"><b>
    <xsl:apply-templates select="." mode="reference"/>
  </b></a>
</xsl:template>

  <xsl:template match="db:footnote" mode="footerStart">
  <h2 class="ftnoteHeader">
    <a id="S.Footnotes">Footnotes</a>
  </h2>
  <ol class="ftnote">
    <xsl:apply-templates select="//db:footnote" mode="footer"/>
  </ol>
</xsl:template>

  <xsl:template match="db:footnote" mode="footer">
  <li>
    <xsl:apply-templates/>
  </li>
</xsl:template>

  <xsl:template match="db:footnote/db:para[1]">
  <p>
    <a id="FT{count(preceding::db:footnote)+count(ancestor-or-self::db:footnote)}"/>
    <xsl:apply-templates select="../@xml:id" />
    <xsl:apply-templates select="@xml:id" />
    <xsl:apply-templates/>
  </p>
</xsl:template>

<!-- Internal anchors -->
<xsl:template match="@xml:id">
  <a id="{.}"/>
</xsl:template>

<xsl:template match="@xml:id" mode="attr">
  <xsl:attribute name="id">
    <xsl:value-of select="."/>
  </xsl:attribute>
</xsl:template>

<!-- Internal links -->
  <xsl:template match="db:xref">
  <a href="#{@linkend}">
    <xsl:apply-templates select="@xml:id" mode="attr"/>
    <xsl:attribute name="class">
      <xsl:apply-templates select="//db:*[@xml:id=current()/@linkend]" mode="refClass"/>
    </xsl:attribute>
  <b>
    <xsl:apply-templates select="//db:*[@xml:id=current()/@linkend]" mode="refLabel"/>
  </b></a>
</xsl:template>

<xsl:template match="db:*" mode="refClass">
  <xsl:text>xref</xsl:text>
</xsl:template>

<xsl:template match="db:bibliomixed" mode="refClass">
  <xsl:text>bibref</xsl:text>
</xsl:template>

  <xsl:template match="db:*" mode="refLabel">
  <xsl:if test="not(@xreflabel)">
    <xsl:apply-templates select="." mode="reference"/>
  </xsl:if>
  <xsl:apply-templates select="@xreflabel"/>
</xsl:template>

  <xsl:template match="db:bibliomixed/@xreflabel">
  <xsl:text>[</xsl:text>
  <xsl:value-of select="."/>
  <xsl:text>]</xsl:text>
</xsl:template>

  <xsl:template match="db:bibliomixed" mode="reference">
  <xsl:text>[</xsl:text>
    <xsl:if test="not(abbrev)">
      <xsl:value-of select="@xml:id"/>
    </xsl:if>
    <xsl:value-of select="db:abbrev[1]/text()"/>
  <xsl:text>]</xsl:text>
</xsl:template>

  <xsl:template match="db:figure|db:figure//*" mode="reference" priority="-0.15">
  <xsl:text>Figure </xsl:text>
    <xsl:value-of select="count(preceding::db:figure)+1"/>
</xsl:template>

  <xsl:template match="db:example|db:example//*" mode="reference" priority="-0.14">
  <xsl:text>Example </xsl:text>
    <xsl:value-of select="count(preceding::db:example)+1"/>
</xsl:template>

  <xsl:template match="db:table|db:table//*" mode="reference" priority="-0.2">
  <xsl:text>Table </xsl:text>
    <xsl:value-of select="count(preceding::db:table)+count(ancestor-or-self::db:table)"/>
</xsl:template>

  <xsl:template match="db:article/db:section" mode="reference">
      <xsl:text>Chapter </xsl:text>
    <xsl:value-of select="count(preceding-sibling::db:section)+1"/>
</xsl:template>

  <xsl:template match="db:article/db:appendix" mode="reference">
      <xsl:text>Appendix </xsl:text>
    <xsl:value-of select="count(preceding-sibling::db:appendix)+1"/>
</xsl:template>

  <xsl:template match="db:article/db:section//db:section" mode="reference">
      <xsl:text>Section </xsl:text>
    <xsl:number level="multiple" format="1.1" count="db:section"/>
</xsl:template>

  <xsl:template match="db:article/db:appendix//db:section" mode="reference">
      <xsl:text>Appendix </xsl:text>
    <xsl:apply-templates select="ancestor-or-self::db:appendix" mode="appendixPrefix"/>
    <xsl:number level="multiple" format="1.1" count="db:section"/>
</xsl:template>

  <xsl:template match="db:personblurb" mode="reference">
    <xsl:apply-templates select="preceding-sibling::db:fname|preceding-sibling::db:surname"/>
</xsl:template>

  <xsl:template match="db:*" mode="reference">
  <xsl:text>Paragraph </xsl:text>
    <xsl:value-of select="count(preceding::db:para)+count(ancestor-or-self::db:para)-count(preceding::db:footnote//db:para)"/>
</xsl:template>

<!-- The table element and its descendants are copied -->
<xsl:template match="db:table">
  <table>
    <xsl:attribute name="class">table</xsl:attribute>
    <xsl:call-template name="style"/>
    <xsl:apply-templates mode="copy"
      select="db:*[not(self::db:title or self::db:mediaobject or self::db:tgroup)]
        |@*[not(local-name()='xreflabel')]"/>
    <xsl:apply-templates select="db:tgroup"/>
  </table>
  <blockquote class="tableHeader">
    <p>
      <b>
        <xsl:text>Table </xsl:text>
        <xsl:value-of select="count(preceding::db:table)+count(ancestor-or-self::db:table)"/>
        <xsl:apply-templates select="db:title"/>
      </b>
    </p>
  </blockquote>
</xsl:template>

  <xsl:template match="db:informaltable">
  <table>
    <xsl:attribute name="class">table</xsl:attribute>
    <xsl:call-template name="style"/>
    <xsl:apply-templates mode="copy"
      select="db:*[not(self::db:mediaobject or self::db:tgroup)]
        |@*[not(local-name()='xreflabel')]"/>
    <xsl:apply-templates select="db:tgroup"/>
  </table>
</xsl:template>

  <xsl:template match="db:entrytbl" mode="copy">
  <table>
    <xsl:attribute name="class">table</xsl:attribute>
    <xsl:call-template name="style"/>
    <xsl:apply-templates mode="copy"
      select="db:*[not(self::db:colspec or self::db:spanspec)]
        |@*[not(local-name()='xreflabel')]"/>
  </table>
</xsl:template>

  <xsl:template match="db:table/db:title">
  <xsl:text>: </xsl:text>
  <xsl:apply-templates/>
</xsl:template>

  <xsl:template match="db:tgroup">
  <colgroup span="{@cols}">
    <xsl:call-template name="style"/>
  </colgroup>
  <xsl:apply-templates mode="copy"
    select="db:*[not(self::db:colspec or self::db:spanspec)]"/>
</xsl:template>

  <xsl:template match="db:row" mode="copy">
  <tr>
    <xsl:call-template name="style"/>
    <xsl:apply-templates select="db:*|@*|text()" mode="copy"/>
  </tr>
</xsl:template>

  <xsl:template match="db:td|db:th|db:caption" mode="copy">
  <xsl:element name="{local-name()}">
    <xsl:call-template name="style"/>
    <xsl:apply-templates select="@*" mode="copy"/>
    <!-- Resume normal translation upon exit of table module -->
    <xsl:apply-templates/>
  </xsl:element>
</xsl:template>

  <xsl:template match="db:entry" mode="copy">
  <td>
    <xsl:call-template name="style"/>
    <xsl:apply-templates mode="colspan"
      select="self::db:entry[(@namest and @nameend) or @spanname]"/>
    <xsl:apply-templates select="@*" mode="copy"/>
    <!-- Resume normal translation upon exit of table module -->
    <xsl:apply-templates/>
  </td>
</xsl:template>

  <xsl:template match="db:entry" mode="colspan">
  <xsl:apply-templates mode="colspan"
    select="preceding::db:spanspec[@spanname=current()/@spanname][1]"/>
</xsl:template>

<xsl:template mode="colspan"
  match="db:entry[@namest and @nameend]|db:spanspec[@namest and @nameend]">
  <xsl:variable name="col1">
    <xsl:apply-templates mode="colposition"
      select="preceding::db:colspec[@colname=current()/@namest][1]"/>
  </xsl:variable>
  <xsl:variable name="col2">
    <xsl:apply-templates mode="colposition"
      select="preceding::db:colspec[@colname=current()/@nameend][1]"/>
  </xsl:variable>
  <xsl:if test="$col2 &gt; $col1">
    <xsl:attribute name="colspan">
      <xsl:value-of select="$col2 - $col1 + 1"/>
    </xsl:attribute>
  </xsl:if>
</xsl:template>

  <xsl:template match="db:colspec" mode="colposition">
    <xsl:value-of select="count(preceding-sibling::db:colspec) + 1"/>
</xsl:template>

<xsl:template match="@morerows" mode="copy">
  <xsl:attribute name="rowspan">
    <xsl:value-of select="number(.) + 1"/>
  </xsl:attribute>
</xsl:template>

<xsl:template match="@namest|@nameend" mode="copy"/>

  <xsl:template match="db:*" mode="copy">
  <xsl:element name="{local-name()}">
    <xsl:call-template name="style"/>
    <xsl:apply-templates select="db:*|@*|text()" mode="copy"/>
  </xsl:element>
</xsl:template>

<xsl:template match="@*|text()" mode="copy">
  <xsl:copy>
    <xsl:apply-templates select="db:*|@*|text()" mode="copy"/>
  </xsl:copy>
</xsl:template>

<xsl:template match="@frame" mode="copy">
  <xsl:attribute name="frame">
    <xsl:choose>
      <xsl:when test=".='all'">box</xsl:when>
      <xsl:when test=".='bottom'">below</xsl:when>
      <xsl:when test=".='none'">void</xsl:when>
      <xsl:when test=".='sides'">vsides</xsl:when>
      <xsl:when test=".='top'">above</xsl:when>
      <xsl:when test=".='topbot'">hsides</xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="."/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:attribute>
</xsl:template>

<!-- Construct the value of an HTML style attribute from DocBook attributes -->
<xsl:template name="style">
  <xsl:if test="@style|@align|@valign|@width">
    <xsl:attribute name="style">
      <xsl:apply-templates select="@align|@valign|@width" mode="css"/>
      <xsl:apply-templates select="@style" mode="css"/>
    </xsl:attribute>
  </xsl:if>
</xsl:template>

<xsl:template match="@style|@align|@valign|@width" mode="copy"/>

<xsl:template match="@*" mode="css">
  <xsl:value-of select="local-name()"/>
  <xsl:text>:</xsl:text>
  <xsl:value-of select="."/>
  <xsl:text>;</xsl:text>
</xsl:template>

<xsl:template match="@style" mode="css">
  <xsl:value-of select="."/>
</xsl:template>

<xsl:template match="@align" mode="css">
  <xsl:text>text-align:</xsl:text>
  <xsl:value-of select="."/>
  <xsl:text>;</xsl:text>
</xsl:template>

<xsl:template match="@valign" mode="css">
  <xsl:text>vertical-align:</xsl:text>
  <xsl:value-of select="."/>
  <xsl:text>;</xsl:text>
</xsl:template>

<!-- Figures -->
<xsl:template match="db:figure">
  <div class="figure">
    <xsl:apply-templates select="@xml:id"/>
    <xsl:apply-templates select="db:mediaobject|db:programlisting|db:para[1]"/>
    <xsl:if test="not(db:title)">
      <xsl:call-template name="db:figureNumber"/>
    </xsl:if>
    <xsl:apply-templates select="db:title"/>
  </div>
</xsl:template>

  <xsl:template match="db:example">
  <div class="figure">
    <xsl:apply-templates select="@xml:id"/>
    <xsl:apply-templates select="db:mediaobject|db:programlisting|db:para[1]"/>
    <xsl:if test="not(db:title)">
      <xsl:call-template name="db:exampleNumber"/>
    </xsl:if>
    <xsl:apply-templates select="db:title"/>
  </div>
</xsl:template>

  <xsl:template name="db:figureNumber">
  <blockquote class="figureTitle">
    <p>
      <b>
        <xsl:text>Figure </xsl:text>
        <xsl:value-of select="count(preceding::db:figure)+1"/>
      </b>
    </p>
  </blockquote>
</xsl:template>

  <xsl:template name="db:exampleNumber">
  <blockquote class="figureTitle">
    <p>
      <b>
        <xsl:text>Example </xsl:text>
        <xsl:value-of select="count(preceding::db:example)+1"/>
      </b>
    </p>
  </blockquote>
</xsl:template>

  <xsl:template match="db:figure/db:title">
  <blockquote class="figureTitle">
    <p>
      <b>
        <xsl:text>Figure </xsl:text>
        <xsl:value-of select="count(preceding::db:figure)+1"/>
        <xsl:text>: </xsl:text>
        <xsl:apply-templates/>
      </b>
    </p>
  </blockquote>
</xsl:template>

  <xsl:template match="db:example/db:title">
  <blockquote class="figureTitle">
    <p>
      <b>
        <xsl:text>Example </xsl:text>
        <xsl:value-of select="count(preceding::db:example)+1"/>
        <xsl:text>: </xsl:text>
        <xsl:apply-templates/>
      </b>
    </p>
  </blockquote>
</xsl:template>

  <xsl:template match="db:mediaobject/db:caption">
  <blockquote class="figcaption">
    <p>
      <xsl:apply-templates select="@xml:id"/>
      <xsl:apply-templates/>
    </p>
  </blockquote>
</xsl:template>

  <xsl:template match="db:figure/db:para[1] | db:example/db:para[1]">
  <blockquote class="figurePara">
    <p>
      <xsl:apply-templates select="@xml:id"/>
      <xsl:apply-templates/>
    </p>
    <xsl:apply-templates select="following-sibling::db:para"/>
  </blockquote>
</xsl:template>

  <xsl:template match="db:mediaobject/db:imageobject/db:imagedata">
  <div class="graphic">
    <xsl:call-template name="Image"/>
  </div>
</xsl:template>

  <xsl:template match="db:objectinfo"/>

  <xsl:template name="Image" match="db:inlinemediaobject/db:imageobject/db:imagedata">
  <xsl:variable name="altText">
    <xsl:choose>
      <xsl:when test="boolean(@fileref)">
        <!-- If there is a fileref attribute, use it directly -->
        <xsl:value-of select="@fileref"/>
      </xsl:when>
      <xsl:otherwise>
        <!-- Otherwise, there is an entityref attribute that takes an entity -->
        <xsl:value-of select="@entityref"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  <xsl:variable name="srcURL">
    <xsl:choose>
      <xsl:when test="boolean(@fileref)">
        <!-- If there is a fileref attribute, use it directly -->
        <xsl:value-of select="@fileref"/>
      </xsl:when>
      <xsl:otherwise>
        <!-- Otherwise, there is an entityref attribute that takes an entity -->
        <!-- Compute the relative URI of the graphic file -->
        <xsl:call-template name="SubstringAfterLast">
          <xsl:with-param name="string" select="unparsed-entity-uri(@entityref)"/>
          <xsl:with-param name="token" select="'/'"/>
        </xsl:call-template>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  <xsl:apply-templates select="../../@xml:id"/>
  <xsl:apply-templates select="../@xml:id"/>
  <xsl:apply-templates select="@xml:id"/>
  <!-- If this is an SVG file, use the 'object' element -->
  <xsl:choose>
    <xsl:when test="substring-after(@fileref,'.')='svg' or substring-after(@fileref,'.')='svgz'">
      <object type="image/svg+xml" data="{$srcURL}">
        <xsl:call-template name="db:dimensions" />
        <xsl:value-of select="$altText"/>
      </object>
    </xsl:when>
    <xsl:otherwise>
      <img alt="{$altText}" src="{$srcURL}">
        <xsl:call-template name="db:dimensions" />
      </img>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<!-- Template to insert width and height attributes as appropriate -->
  <xsl:template name="db:dimensions">
  <!-- In order of priority, use this source info to determine width and height:
       1. @contentwidth/@contentdepth if at least one is not a percentage
       2. nothing if one is a percentage or @scale is specified or @scalefit='0'
          (HTML has no way to scale relative to intrinsic image dimensions)
       3. @width/@depth
       4. set width="100%" if @scalefit='1'
       5. nothing
       When depths and widths are given in CSS units (e.g. "6in"), compute
       pixels assuming 96dpi. When in unrecognized units, ignore attribute. -->
  <xsl:variable name="pixelWidth"> <!-- 0 means don't include width attribute -->
    <xsl:choose>
      <xsl:when test="@contentwidth or @contentdepth">
        <xsl:choose>
          <xsl:when test="not(@contentwidth)">0</xsl:when>
          <xsl:when test="contains(@contentwidth,'%')">0</xsl:when>
          <xsl:otherwise>
            <xsl:call-template name="ConvertToPixels">
              <xsl:with-param name="length" select="@contentwidth"/>
            </xsl:call-template>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <xsl:when test="@scale or @scalefit='0'">0</xsl:when>
      <xsl:when test="@width or @depth">
        <xsl:choose>
          <xsl:when test="not(@width)">0</xsl:when>
          <xsl:when test="contains(@width,'%')">
            <xsl:value-of select="@width"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:call-template name="ConvertToPixels">
              <xsl:with-param name="length" select="@width"/>
            </xsl:call-template>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <xsl:when test="@scalefit='1'">100%</xsl:when>
      <xsl:otherwise>0</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  <xsl:variable name="pixelHeight"> <!-- 0 means don't include height attribute -->
    <xsl:choose>
      <xsl:when test="@contentwidth or @contentdepth">
        <xsl:choose>
          <xsl:when test="not(@contentdepth)">0</xsl:when>
          <xsl:when test="contains(@contentdepth,'%')">0</xsl:when>
          <xsl:otherwise>
            <xsl:call-template name="ConvertToPixels">
              <xsl:with-param name="length" select="@contentdepth"/>
            </xsl:call-template>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <xsl:when test="@scale or @scalefit='0'">0</xsl:when>
      <xsl:when test="@width or @depth">
        <xsl:choose>
          <xsl:when test="not(@depth)">0</xsl:when>
          <xsl:when test="contains(@depth,'%')">
            <xsl:value-of select="@depth"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:call-template name="ConvertToPixels">
              <xsl:with-param name="length" select="@depth"/>
            </xsl:call-template>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <xsl:otherwise>0</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  <xsl:if test="not($pixelWidth=0)">
    <xsl:attribute name="width">
      <xsl:value-of select="$pixelWidth"/>
    </xsl:attribute>
  </xsl:if>
  <xsl:if test="not($pixelHeight=0)">
    <xsl:attribute name="height">
      <xsl:value-of select="$pixelHeight"/>
    </xsl:attribute>
  </xsl:if>
</xsl:template>

<!-- Utility function to convert lengths to pixels -->
  <xsl:template name="ConvertToPixels">
  <xsl:param name="length"/>
  <xsl:variable name="pixels" select="number(substring-before($length,'px'))"/>
  <xsl:variable name="inches" select="number(substring-before($length,'in'))"/>
  <xsl:variable name="cms" select="number(substring-before($length,'cm'))"/>
  <xsl:variable name="mms" select="number(substring-before($length,'mm'))"/>
  <xsl:variable name="pts" select="number(substring-before($length,'pt'))"/>
  <xsl:variable name="picas" select="number(substring-before($length,'pc'))"/>
  <xsl:variable name="ems" select="number(substring-before($length,'em'))"/>
  <xsl:choose>
    <xsl:when test="boolean(number($length))"> <!-- Note: boolean(NaN)=false -->
      <xsl:value-of select="$length"/>
    </xsl:when>
    <xsl:when test="boolean($pixels)">
      <xsl:value-of select="$pixels"/>
    </xsl:when>
    <xsl:when test="boolean($inches)">
      <xsl:value-of select="96 * $inches"/>
    </xsl:when>
    <xsl:when test="boolean($cms)">
      <xsl:value-of select="(96 * $cms) div 2.54"/>
    </xsl:when>
    <xsl:when test="boolean($mms)">
      <xsl:value-of select="(96 * $mms) div 25.4"/>
    </xsl:when>
    <xsl:when test="boolean($pts)">
      <xsl:value-of select="(96 * $pts) div 72"/>
    </xsl:when>
    <xsl:when test="boolean($picas)">
      <xsl:value-of select="(96 * $picas) div 6"/>
    </xsl:when>
    <xsl:when test="boolean($ems)">
      <xsl:value-of select="(96 * $ems) div 6"/>
    </xsl:when>
    <xsl:otherwise>0</xsl:otherwise>
  </xsl:choose>
</xsl:template>

<!-- Utility function to find the substring after the last occurrence of a token -->
<xsl:template name="SubstringAfterLast">
  <xsl:param name="string"/>
  <xsl:param name="token"/>
  <xsl:choose>
    <xsl:when test="contains($string,$token)">
      <xsl:call-template name="SubstringAfterLast">
        <xsl:with-param name="string" select="substring-after($string,$token)"/>
        <xsl:with-param name="token" select="$token"/>
      </xsl:call-template>
    </xsl:when>
    <xsl:otherwise>
      <xsl:value-of select="$string"/>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<!-- Section/subsection titles become h2, h3, h4, h5, h6
     The titles are automatically numbered
     Two kinds of anchors are generated at each heading:
     1. An anchor whose name is the section id attribute, if it exists
     2. A unique numerical anchor used by Table of Contents -->
  <xsl:template match="db:sectioninfo/db:keywordset">
    <xsl:apply-templates select="db:keyword[1]"/>
</xsl:template>

<xsl:template match="db:section/db:title">
  <h2>
    <xsl:call-template name="db:anchoredNumberedTitle">
      <xsl:with-param name="prefix">
        <xsl:number level="single" format="1." count="db:section"/>
      </xsl:with-param>
    </xsl:call-template>
  </h2>      
</xsl:template>

  <xsl:template match="db:appendix/db:title">
  <h2>
    <xsl:call-template name="db:anchoredNumberedTitle">
      <xsl:with-param name="prefix">
        <xsl:apply-templates select="ancestor-or-self::db:appendix" mode="appendixPrefix"/>
      </xsl:with-param>
    </xsl:call-template>
  </h2>      
</xsl:template>

<xsl:template match="db:section/db:section/db:title
  | db:appendix/db:section/db:title" priority="1">
  <h3><xsl:call-template name="db:subsectionTitle"/></h3>      
</xsl:template>

<xsl:template match="db:section/db:section/db:section/db:title
  | db:appendix/db:section/db:section/db:title" priority="2">
  <h4><xsl:call-template name="db:subsectionTitle"/></h4>      
</xsl:template>

  <xsl:template match="db:section/db:section/db:section/db:section/db:title
    | db:appendix/db:section/db:section/db:section/db:title" priority="3">
    <h5><xsl:call-template name="db:subsectionTitle"/></h5>      
</xsl:template>

  <xsl:template match="db:section/db:section/db:section/db:section/db:section/db:title
    | db:appendix/db:section/db:section/db:section/db:section/db:title" priority="4">
    <h6><xsl:call-template name="db:subsectionTitle"/></h6>      
</xsl:template>

  <xsl:template name="db:subsectionTitle">
    <xsl:call-template name="db:anchoredNumberedTitle">
    <xsl:with-param name="prefix">
      <xsl:apply-templates select="ancestor-or-self::db:appendix" mode="appendixPrefix"/>
      <xsl:number level="multiple" format="1.1" count="section"/>
    </xsl:with-param>
  </xsl:call-template>
</xsl:template>

  <xsl:template match="db:appendix" mode="appendixPrefix">
    <xsl:number level="single" format="1." count="db:appendix"/>
</xsl:template>

  <xsl:template name="db:anchoredNumberedTitle">
  <xsl:param name="prefix"/>
  <xsl:variable name="preprefix">
    <xsl:if test="ancestor-or-self::db:appendix">
      <xsl:text>A</xsl:text>
    </xsl:if>
  </xsl:variable>
  <xsl:apply-templates select="../@xml:id"/>
  <a id="S{$preprefix}{$prefix}">
    <xsl:if test="ancestor-or-self::db:appendix">
      <xsl:text>Appendix </xsl:text>
    </xsl:if>
    <xsl:value-of select="$prefix"/>
    <xsl:text> </xsl:text>
    <xsl:apply-templates/>
  </a>
</xsl:template>

  <xsl:template match="db:sectioninfo/db:keywordset/db:keyword[1]">
  <p class="sectKeyword">
    <i class="sectKeywordHeader"><xsl:text>Keywords: </xsl:text></i>
    <xsl:call-template name="db:keywordAnchor"/>
    <xsl:apply-templates/>
    <xsl:apply-templates select="following-sibling::keyword"/>
  </p>
</xsl:template>

<!-- Table of Contents -->
<xsl:template match="db:title" mode="toc"/>

<xsl:template match="db:section/db:title" mode="toc">
  <b>
    <xsl:call-template name="linkedNumberedTitle">
      <xsl:with-param name="prefix">
        <xsl:number level="single" format="1."
          count="db:section"/>
      </xsl:with-param>
    </xsl:call-template>
  </b>
  <br/>
</xsl:template>

<xsl:template match="db:appendix/db:title" mode="toc">
  <b>
    <xsl:call-template name="linkedNumberedTitle">
      <xsl:with-param name="prefix">
        <xsl:apply-templates select="ancestor-or-self::db:appendix" mode="appendixPrefix"/>
      </xsl:with-param>
    </xsl:call-template>
  </b>
  <br/>
</xsl:template>

<xsl:template match="db:section/db:section/db:title
  | db:appendix/db:section/db:title" mode="toc" priority="1">
  <xsl:apply-templates select="../.." mode="indent"/>
    <xsl:call-template name="linkedNumberedTitle">
      <xsl:with-param name="prefix">
        <xsl:apply-templates select="ancestor-or-self::db:appendix" mode="appendixPrefix"/>
        <xsl:number level="multiple" format="1.1"
          count="db:section"/>
      </xsl:with-param>
    </xsl:call-template>
  <br/>
</xsl:template>

<xsl:template match="db:section | db:appendix" mode="indent">
  <xsl:text disable-output-escaping="yes">
    <![CDATA[&nbsp;&nbsp;&nbsp;&nbsp;]]>
  </xsl:text>
  <xsl:apply-templates select="parent::db:section" mode="indent"/>
</xsl:template>

<xsl:template name="linkedNumberedTitle">
  <xsl:param name="prefix"/>
  <xsl:variable name="preprefix">
    <xsl:if test="ancestor-or-self::db:appendix">
      <xsl:text>A</xsl:text>
    </xsl:if>
  </xsl:variable>
  <a href="#S{$preprefix}{$prefix}">
    <xsl:if test="ancestor-or-self::db:appendix">
      <xsl:text>Appendix </xsl:text>
    </xsl:if>
    <xsl:value-of select="$prefix"/>
    <xsl:text> </xsl:text>
    <xsl:apply-templates mode="titleText"/>
  </a>
</xsl:template>

  <xsl:template match="db:expansion|db:footnote" mode="titleText"/>

<xsl:template match="text()" mode="titleText">
  <xsl:value-of select="."/>
</xsl:template>

  <xsl:template match="db:footnote" mode="toc">
  <b><a href="#S.Footnotes">Footnotes</a></b>
  <br/>
</xsl:template>

  <xsl:template match="db:ackno" mode="toc">
  <b><a href="#S.Acknowledgements">Acknowledgements</a></b>
  <br/>
</xsl:template>

  <xsl:template match="db:bibliography" mode="toc">
  <b><a href="#S.Bibliography">Bibliography</a></b>
  <br/>
</xsl:template>

</xsl:stylesheet>
